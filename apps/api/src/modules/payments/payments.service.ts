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
    const order = await this.prisma.order.create({
      data: {
        merchantId: merchant.id,
        channelId: channels[0].id,
        orderNo: `P${new Date().getFullYear()}${nanoid(10).toUpperCase()}`,
        merchantOrderNo: body.merchantOrderNo,
        amount,
        currency: body.currency,
        feeAmount,
        netAmount,
        status: "PROCESSING",
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
        paymentUrl: routed.paymentUrl,
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
