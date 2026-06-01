import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { safeCompare, signPayload } from "../../common/signature";
import { PrismaService } from "../../prisma/prisma.service";

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
    const channels = await this.prisma.channel.findMany({
      where: { currency: body.currency, status: "ACTIVE" },
      orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
    });
    if (channels.length === 0) {
      throw new BadRequestException("1006 Channel unavailable");
    }

    const amount = new Prisma.Decimal(body.amount);
    const feeAmount = amount.mul(merchant.feeRate);
    const netAmount = amount.sub(feeAmount);
    const orderNo = `P${new Date().getFullYear()}${nanoid(10).toUpperCase()}`;
    const order = await this.prisma.order.create({
      data: {
        merchantId: merchant.id,
        channelId: channels[0].id,
        orderNo,
        merchantOrderNo: body.merchantOrderNo,
        amount,
        currency: body.currency,
        feeAmount,
        netAmount,
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

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: order.id } });
      if (current?.status === "PAID") {
        return current;
      }

      const paid = await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      const wallet = await tx.wallet.upsert({
        where: { merchantId: order.merchantId },
        create: {
          merchantId: order.merchantId,
          balance: order.netAmount,
          availableBalance: order.netAmount,
          currency: order.currency,
        },
        update: {
          balance: { increment: order.netAmount },
          availableBalance: { increment: order.netAmount },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          merchantId: order.merchantId,
          type: "PAYMENT_IN",
          amount: order.netAmount,
          balanceAfter: wallet.availableBalance,
          referenceType: "ORDER",
          referenceId: order.id,
          description: `Payment success ${order.orderNo}`,
        },
      });
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
          },
          responseStatus: 200,
          responseBody: "queued",
          status: "SUCCESS",
        },
      });
      return paid;
    });
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

    const fee = this.calculateFees(order.amount, selected);
    await this.settlePaidOrder(order.id, selected.channelId, fee.feeAmount, fee.netAmount, {
      providerReference: "sandbox_checkout",
      pspFee: fee.pspFee.toFixed(2),
      agentProfit: fee.agentProfit.toFixed(2),
      platformProfit: fee.platformProfit.toFixed(2),
    });
    return this.getCheckout(orderNo);
  }

  private async routePayment(orderId: string, channels: { id: string; name: string }[]) {
    for (const [index, channel] of channels.entries()) {
      const simulatedFailure = index === 0 && channels.length > 1;
      await this.prisma.paymentAttempt.create({
        data: {
          orderId,
          channelId: channel.id,
          attemptNo: index + 1,
          status: simulatedFailure ? "FAILED" : "SUCCESS",
          requestPayload: { orderId, channel: channel.name },
          responsePayload: simulatedFailure ? undefined : { paymentUrl: `https://checkout.payhub.local/${orderId}` },
          errorMessage: simulatedFailure ? "Primary channel simulated failure" : undefined,
        },
      });
      if (!simulatedFailure) {
        return {
          success: true,
          channelId: channel.id,
          paymentUrl: `https://checkout.payhub.local/${orderId}`,
        };
      }
    }
    return {
      success: false,
      channelId: channels[0].id,
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
          supplier: { status: "ACTIVE" },
          paymentMethod: paymentMethod && paymentMethod !== "SANDBOX_PAY" ? (paymentMethod as any) : undefined,
        },
      },
      include: { channel: { include: { supplier: true } } },
      orderBy: [{ isPrimary: "desc" }, { isBackup: "desc" }, { createdAt: "asc" }],
    });
    if (merchantChannels.length > 0) {
      return merchantChannels;
    }
    const channels = await this.prisma.channel.findMany({
      where: { currency, status: "ACTIVE", supplier: { status: "ACTIVE" }, paymentMethod: paymentMethod && paymentMethod !== "SANDBOX_PAY" ? (paymentMethod as any) : undefined },
      include: { supplier: true },
      orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
    });
    return channels.map((channel) => ({
      id: `global_${channel.id}`,
      merchantId,
      channelId: channel.id,
      isEnabled: true,
      isPrimary: channel.isPrimary,
      isBackup: channel.isBackup,
      merchantFeeRate: channel.feeRate,
      merchantFixedFee: new Prisma.Decimal("0"),
      pspCostRate: channel.feeRate,
      pspFixedFee: new Prisma.Decimal("0"),
      agentCommissionRate: new Prisma.Decimal("0"),
      minFee: new Prisma.Decimal("0"),
      maxFee: null,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      channel,
    }));
  }

  private calculateFees(amount: Prisma.Decimal, config: { merchantFeeRate: Prisma.Decimal; merchantFixedFee: Prisma.Decimal; pspCostRate: Prisma.Decimal; pspFixedFee: Prisma.Decimal; minFee: Prisma.Decimal; maxFee: Prisma.Decimal | null }) {
    let merchantFee = amount.mul(config.merchantFeeRate).plus(config.merchantFixedFee);
    if (merchantFee.lt(config.minFee)) {
      merchantFee = config.minFee;
    }
    if (config.maxFee && merchantFee.gt(config.maxFee)) {
      merchantFee = config.maxFee;
    }
    const pspFee = amount.mul(config.pspCostRate).plus(config.pspFixedFee);
    const platformMinFee = amount.mul(config.pspCostRate);
    return {
      feeAmount: merchantFee,
      netAmount: amount.sub(merchantFee),
      pspFee,
      agentProfit: merchantFee.sub(platformMinFee),
      platformProfit: platformMinFee.sub(pspFee),
    };
  }

  private async nextAttemptNo(orderId: string) {
    const last = await this.prisma.paymentAttempt.findFirst({ where: { orderId }, orderBy: { attemptNo: "desc" } });
    return (last?.attemptNo ?? 0) + 1;
  }

  private async settlePaidOrder(orderId: string, channelId: string, feeAmount: Prisma.Decimal, netAmount: Prisma.Decimal, meta: Record<string, string>) {
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
        data: { status: "PAID", paidAt: new Date(), channelId, feeAmount, netAmount, failedReason: null },
      });
      const wallet = await tx.wallet.upsert({
        where: { merchantId: order.merchantId },
        create: { merchantId: order.merchantId, balance: netAmount, availableBalance: netAmount, currency: order.currency },
        update: { balance: { increment: netAmount }, availableBalance: { increment: netAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          merchantId: order.merchantId,
          type: "PAYMENT_IN",
          amount: netAmount,
          balanceAfter: wallet.availableBalance,
          referenceType: "ORDER",
          referenceId: order.id,
          description: `Checkout payment success ${order.orderNo}; fee ${feeAmount.toFixed(2)}`,
        },
      });
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
