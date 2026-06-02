import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { safeCompare, signPayload } from "../../common/signature";
import { PrismaService } from "../../prisma/prisma.service";

type FeeBreakdown = {
  merchantFeeAmount: Prisma.Decimal;
  agentProfitAmount: Prisma.Decimal;
  platformProfitAmount: Prisma.Decimal;
  pspCostAmount: Prisma.Decimal;
  merchantNetBeforeReserve: Prisma.Decimal;
  rollingReserveAmount: Prisma.Decimal;
  merchantAvailableAmount: Prisma.Decimal;
};

@Injectable()
export class PaymentsService {
  private readonly nonceCache = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async createPayment(
    body: { merchantOrderNo: string; amount: string; currency: string; customerEmail?: string },
    headers: Record<string, string>,
    customerIp?: string,
  ) {
    const merchant = await this.verifyMerchantSignature(headers, JSON.stringify(body));
    const channels = await this.availableMerchantChannels(merchant.id, body.currency);
    if (channels.length === 0) {
      throw new BadRequestException("1006 Channel unavailable");
    }

    const amount = new Prisma.Decimal(body.amount);
    const fee = await this.calculateFees(amount, channels[0], merchant.agentId);
    const orderNo = `P${new Date().getFullYear()}${nanoid(10).toUpperCase()}`;
    const order = await this.prisma.order.create({
      data: {
        merchantId: merchant.id,
        channelId: channels[0].channelId,
        orderNo,
        merchantOrderNo: body.merchantOrderNo,
        amount,
        currency: body.currency,
        feeAmount: fee.merchantFeeAmount,
        netAmount: fee.merchantAvailableAmount,
        merchantFeeAmount: fee.merchantFeeAmount,
        agentProfitAmount: fee.agentProfitAmount,
        platformProfitAmount: fee.platformProfitAmount,
        pspCostAmount: fee.pspCostAmount,
        merchantNetBeforeReserve: fee.merchantNetBeforeReserve,
        rollingReserveAmount: fee.rollingReserveAmount,
        merchantAvailableAmount: fee.merchantAvailableAmount,
        status: "PROCESSING",
        paymentUrl: `/checkout/${orderNo}`,
        customerEmail: body.customerEmail,
        customerIp,
      },
    });

    const routed = await this.routePayment(order.id, channels);
    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        channelId: routed.channelId,
        status: routed.success ? "PROCESSING" : "FAILED",
        paymentUrl: `/checkout/${order.orderNo}`,
        failedReason: routed.success ? null : routed.errorMessage,
      },
    });
  }

  getOrderByNo(orderNo: string) {
    return this.prisma.order.findUnique({
      where: { orderNo },
      include: { attempts: true, refunds: true },
    });
  }

  async createRefund(body: { orderNo: string; amount: string; reason?: string }) {
    const order = await this.prisma.order.findUnique({ where: { orderNo: body.orderNo } });
    if (!order) {
      throw new BadRequestException("1007 Order not found");
    }
    return this.prisma.refund.create({
      data: {
        orderId: order.id,
        merchantId: order.merchantId,
        refundNo: `R${new Date().getFullYear()}${nanoid(10).toUpperCase()}`,
        amount: new Prisma.Decimal(body.amount),
        reason: body.reason,
        status: "PENDING",
      },
    });
  }

  async handlePspNotify(body: { orderNo: string; status: "PAID" | "FAILED"; providerReference?: string }) {
    const order = await this.prisma.order.findUnique({ where: { orderNo: body.orderNo }, include: { merchant: true } });
    if (!order) {
      throw new BadRequestException("1007 Order not found");
    }

    if (body.status === "FAILED") {
      return this.prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", failedReason: body.providerReference ?? "Provider failure" },
      });
    }

    if (!order.channelId) {
      throw new BadRequestException("1006 Channel unavailable");
    }
    const merchantChannel = await this.prisma.merchantChannel.findUnique({
      where: { merchantId_channelId: { merchantId: order.merchantId, channelId: order.channelId } },
      include: { channel: true },
    });
    if (!merchantChannel) {
      throw new BadRequestException("1006 Channel unavailable");
    }
    const fee = await this.calculateFees(order.amount, merchantChannel, order.merchant.agentId);
    return this.settlePaidOrder(order.id, order.channelId, fee, { providerReference: body.providerReference ?? "psp_notify" });
  }

  async getCheckout(orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: {
        merchant: true,
        channel: { include: { supplier: true } },
        attempts: { include: { channel: { include: { supplier: true } } }, orderBy: { attemptNo: "asc" } },
      },
    });
    if (!order) {
      throw new BadRequestException("1007 Order not found");
    }
    const methods = await this.availableMerchantChannels(order.merchantId, order.currency);
    return {
      order,
      merchant: order.merchant,
      paymentMethods: ["CARD", "LOCAL_PAYMENT", "BANK_TRANSFER", "SANDBOX_PAY"],
      channels: methods,
      expired: order.status === "CANCELLED",
    };
  }

  async payCheckout(orderNo: string, body: { paymentMethod?: string; sandboxResult?: "success" | "failed" | "timeout" }) {
    const order = await this.prisma.order.findUnique({ where: { orderNo }, include: { merchant: true } });
    if (!order) {
      throw new BadRequestException("1007 Order not found");
    }
    if (order.status === "PAID") {
      return this.getCheckout(orderNo);
    }
    if (["REFUNDED", "CANCELLED"].includes(order.status)) {
      throw new BadRequestException("ORDER_NOT_PAYABLE");
    }

    const channels = await this.availableMerchantChannels(order.merchantId, order.currency, body.paymentMethod);
    if (channels.length === 0) {
      throw new BadRequestException("1006 Channel unavailable");
    }

    if (body.sandboxResult === "timeout") {
      await this.prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          channelId: channels[0].channelId,
          attemptNo: (await this.nextAttemptNo(order.id)),
          status: "PENDING",
          requestPayload: { orderNo, paymentMethod: body.paymentMethod, sandboxResult: "timeout" },
          responsePayload: { status: "PROCESSING" },
        },
      });
      await this.prisma.order.update({ where: { id: order.id }, data: { status: "PROCESSING", channelId: channels[0].channelId } });
      return this.getCheckout(orderNo);
    }

    if (body.sandboxResult === "failed") {
      await this.prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          channelId: channels[0].channelId,
          attemptNo: (await this.nextAttemptNo(order.id)),
          status: "FAILED",
          requestPayload: { orderNo, paymentMethod: body.paymentMethod, sandboxResult: "failed" },
          errorMessage: "Sandbox payment failed",
        },
      });
      await this.prisma.order.update({ where: { id: order.id }, data: { status: "FAILED", channelId: channels[0].channelId, failedReason: "Sandbox payment failed" } });
      return this.getCheckout(orderNo);
    }

    const primary = channels.find((item) => item.isPrimary) ?? channels[0];
    const backup = channels.find((item) => item.isBackup && item.channelId !== primary.channelId);
    let selected = primary;
    let attemptNo = await this.nextAttemptNo(order.id);
    if (backup) {
      await this.prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          channelId: primary.channelId,
          attemptNo,
          status: "FAILED",
          requestPayload: { orderNo, paymentMethod: body.paymentMethod, sandboxResult: "success" },
          errorMessage: "Primary channel simulated failure",
        },
      });
      selected = backup;
      attemptNo += 1;
    }

    await this.prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        channelId: selected.channelId,
        attemptNo,
        status: "SUCCESS",
        requestPayload: { orderNo, paymentMethod: body.paymentMethod, sandboxResult: "success" },
        responsePayload: { status: "PAID", providerReference: `sandbox_${nanoid(8)}` },
      },
    });

    const fee = await this.calculateFees(order.amount, selected, order.merchant.agentId);
    await this.settlePaidOrder(order.id, selected.channelId, fee, {
      providerReference: "sandbox_checkout",
      pspCost: fee.pspCostAmount.toFixed(2),
      agentProfit: fee.agentProfitAmount.toFixed(2),
      platformProfit: fee.platformProfitAmount.toFixed(2),
      rollingReserve: fee.rollingReserveAmount.toFixed(2),
    });
    return this.getCheckout(orderNo);
  }

  private async routePayment(orderId: string, channels: { channelId: string; channel: { name: string } }[]) {
    for (const [index, channel] of channels.entries()) {
      const simulatedFailure = index === 0 && channels.length > 1;
      await this.prisma.paymentAttempt.create({
        data: {
          orderId,
          channelId: channel.channelId,
          attemptNo: index + 1,
          status: simulatedFailure ? "FAILED" : "SUCCESS",
          requestPayload: { orderId, channel: channel.channel.name },
          responsePayload: simulatedFailure ? undefined : { paymentUrl: `https://checkout.payhub.local/${orderId}` },
          errorMessage: simulatedFailure ? "Primary channel simulated failure" : undefined,
        },
      });
      if (!simulatedFailure) {
        return {
          success: true,
          channelId: channel.channelId,
          paymentUrl: `https://checkout.payhub.local/${orderId}`,
        };
      }
    }
    return {
      success: false,
      channelId: channels[0].channelId,
      errorMessage: "All channels failed",
    };
  }

  private async availableMerchantChannels(merchantId: string, currency: string, paymentMethod?: string) {
    const merchantChannels = await this.prisma.merchantChannel.findMany({
      where: {
        merchantId,
        isEnabled: true,
        channel: {
          currency,
          status: "ACTIVE",
          paymentMethod: paymentMethod && paymentMethod !== "SANDBOX_PAY" ? (paymentMethod as any) : undefined,
        },
      },
      include: { channel: true },
      orderBy: [{ isPrimary: "desc" }, { isBackup: "desc" }, { updatedAt: "desc" }],
    });
    return merchantChannels;
  }

  private async calculateFees(amount: Prisma.Decimal, config: { merchantId: string; channelId: string; merchantFeeRate: Prisma.Decimal; merchantFixedFee: Prisma.Decimal; minFee: Prisma.Decimal; maxFee: Prisma.Decimal | null; channel: { pspCostRate: Prisma.Decimal; pspFixedFee: Prisma.Decimal; rollingReserveRate: Prisma.Decimal; rollingReserveDays: number } }, agentId: string | null) {
    let merchantFee = amount.mul(config.merchantFeeRate).plus(config.merchantFixedFee);
    if (merchantFee.lt(config.minFee)) {
      merchantFee = config.minFee;
    }
    if (config.maxFee && merchantFee.gt(config.maxFee)) {
      merchantFee = config.maxFee;
    }
    const agentChannel = agentId
      ? await this.prisma.agentChannel.findUnique({ where: { agentId_channelId: { agentId, channelId: config.channelId } } })
      : null;
    const agentBaseFee = amount.mul(agentChannel?.agentFeeRate ?? config.channel.pspCostRate).plus(agentChannel?.agentFixedFee ?? new Prisma.Decimal("0"));
    const pspCost = amount.mul(config.channel.pspCostRate).plus(config.channel.pspFixedFee);
    const merchantNetBeforeReserve = amount.sub(merchantFee);
    const rollingReserveAmount = merchantNetBeforeReserve.mul(config.channel.rollingReserveRate);
    const merchantAvailableAmount = merchantNetBeforeReserve.sub(rollingReserveAmount);
    return {
      merchantFeeAmount: merchantFee,
      agentProfitAmount: merchantFee.sub(agentBaseFee),
      platformProfitAmount: agentBaseFee.sub(pspCost),
      pspCostAmount: pspCost,
      merchantNetBeforeReserve,
      rollingReserveAmount,
      merchantAvailableAmount,
    };
  }

  private async nextAttemptNo(orderId: string) {
    const last = await this.prisma.paymentAttempt.findFirst({ where: { orderId }, orderBy: { attemptNo: "desc" } });
    return (last?.attemptNo ?? 0) + 1;
  }

  private async settlePaidOrder(orderId: string, channelId: string, fee: FeeBreakdown, meta: Record<string, string>) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { merchant: true } });
    if (!order) {
      throw new BadRequestException("1007 Order not found");
    }
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (current?.status === "PAID") {
        return current;
      }
      const paid = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          channelId,
          feeAmount: fee.merchantFeeAmount,
          netAmount: fee.merchantAvailableAmount,
          merchantFeeAmount: fee.merchantFeeAmount,
          agentProfitAmount: fee.agentProfitAmount,
          platformProfitAmount: fee.platformProfitAmount,
          pspCostAmount: fee.pspCostAmount,
          merchantNetBeforeReserve: fee.merchantNetBeforeReserve,
          rollingReserveAmount: fee.rollingReserveAmount,
          merchantAvailableAmount: fee.merchantAvailableAmount,
          failedReason: null,
        },
      });
      const wallet = await tx.wallet.upsert({
        where: { merchantId: order.merchantId },
        create: {
          merchantId: order.merchantId,
          balance: fee.merchantNetBeforeReserve,
          availableBalance: fee.merchantAvailableAmount,
          rollingReserveBalance: fee.rollingReserveAmount,
          currency: order.currency,
        },
        update: {
          balance: { increment: fee.merchantNetBeforeReserve },
          availableBalance: { increment: fee.merchantAvailableAmount },
          rollingReserveBalance: { increment: fee.rollingReserveAmount },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          merchantId: order.merchantId,
          type: "PAYMENT_IN",
          amount: order.amount,
          balanceAfter: wallet.availableBalance,
          referenceType: "ORDER",
          referenceId: order.id,
          description: `Checkout payment success ${order.orderNo}`,
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          merchantId: order.merchantId,
          type: "MERCHANT_FEE_OUT",
          amount: fee.merchantFeeAmount,
          balanceAfter: wallet.availableBalance,
          referenceType: "ORDER",
          referenceId: order.id,
          description: `Merchant fee ${fee.merchantFeeAmount.toFixed(2)}`,
        },
      });
      if (fee.rollingReserveAmount.gt(0)) {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            merchantId: order.merchantId,
            type: "ROLLING_RESERVE_HOLD",
            amount: fee.rollingReserveAmount,
            balanceAfter: wallet.availableBalance,
            referenceType: "ORDER",
            referenceId: order.id,
            description: `Rolling reserve hold ${fee.rollingReserveAmount.toFixed(2)}`,
          },
        });
        const channel = await tx.channel.findUnique({ where: { id: channelId } });
        await tx.rollingReserveRecord.create({
          data: {
            merchantId: order.merchantId,
            orderId: order.id,
            channelId,
            amount: fee.rollingReserveAmount,
            holdDays: channel?.rollingReserveDays ?? 0,
            releaseAt: channel?.rollingReserveDays ? new Date(Date.now() + channel.rollingReserveDays * 24 * 60 * 60 * 1000) : null,
          },
        });
      }
      await tx.webhookLog.create({
        data: {
          merchantId: order.merchantId,
          orderId: order.id,
          url: "mock://merchant-webhook",
          requestPayload: {
            event: "payment.success",
            orderNo: order.orderNo,
            merchantOrderNo: order.merchantOrderNo,
            amount: order.amount.toString(),
            currency: order.currency,
            status: "PAID",
            ...meta,
          },
          responseStatus: 200,
          responseBody: "queued",
          status: "SUCCESS",
        },
      });
      return paid;
    });
  }

  private async verifyMerchantSignature(headers: Record<string, string>, body: string) {
    const apiKey = headers["x-api-key"];
    const timestamp = headers["x-timestamp"];
    const nonce = headers["x-nonce"];
    const signature = headers["x-signature"];

    if (!apiKey || !timestamp || !nonce || !signature) {
      throw new UnauthorizedException("Missing API signature headers");
    }

    const ageMs = Math.abs(Date.now() - Number(timestamp));
    if (Number.isNaN(ageMs) || ageMs > 5 * 60 * 1000) {
      throw new UnauthorizedException("1003 Timestamp expired");
    }

    const nonceKey = `${apiKey}:${nonce}`;
    this.purgeNonceCache();
    if (this.nonceCache.has(nonceKey)) {
      throw new UnauthorizedException("1004 Nonce repeated");
    }
    this.nonceCache.set(nonceKey, Date.now() + 5 * 60 * 1000);

    const record = await this.prisma.apiKey.findUnique({ where: { apiKey }, include: { merchant: true } });
    if (!record || record.status !== "ACTIVE" || record.merchant.status !== "ACTIVE") {
      throw new UnauthorizedException("1001 API key not found or merchant inactive");
    }

    const expected = signPayload(record.apiSecretHash, timestamp, nonce, body);
    if (!safeCompare(expected, signature)) {
      throw new UnauthorizedException("1002 Signature error");
    }
    return record.merchant;
  }

  private purgeNonceCache() {
    const now = Date.now();
    for (const [key, expiresAt] of this.nonceCache.entries()) {
      if (expiresAt < now) {
        this.nonceCache.delete(key);
      }
    }
  }
}
