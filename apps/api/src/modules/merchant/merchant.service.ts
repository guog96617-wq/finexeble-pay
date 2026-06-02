import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  private async demoMerchant() {
    const merchant = await this.prisma.merchant.findFirst({ where: { status: "ACTIVE" } });
    if (!merchant) {
      throw new BadRequestException("No active merchant seeded");
    }
    return merchant;
  }

  async dashboard() {
    const merchant = await this.demoMerchant();
    const [orders, paid, wallet] = await Promise.all([
      this.prisma.order.count({ where: { merchantId: merchant.id } }),
      this.prisma.order.count({ where: { merchantId: merchant.id, status: "PAID" } }),
      this.prisma.wallet.findUnique({ where: { merchantId: merchant.id } }),
    ]);
    return {
      todayReceipts: "5620.00",
      yesterdayReceipts: "4975.00",
      totalOrders: orders,
      successRate: orders === 0 ? 0 : Number(((paid / orders) * 100).toFixed(2)),
      availableBalance: wallet?.availableBalance ?? "0.00",
    };
  }

  async createManualOrder(body: Record<string, unknown>) {
    const merchant = await this.demoMerchant();
    const orderNo = `P${new Date().getFullYear()}${nanoid(10).toUpperCase()}`;
    return this.prisma.order.create({
      data: {
        merchantId: merchant.id,
        orderNo,
        merchantOrderNo: String(body.merchantOrderNo ?? nanoid(8)),
        amount: new Prisma.Decimal(String(body.amount ?? "0")),
        currency: String(body.currency ?? "USD"),
        customerEmail: body.customerEmail ? String(body.customerEmail) : undefined,
        status: "PENDING",
        paymentUrl: `/checkout/${orderNo}`,
      },
    });
  }

  async orders() {
    const merchant = await this.demoMerchant();
    return this.prisma.order.findMany({ where: { merchantId: merchant.id }, include: { channel: true, attempts: { include: { channel: true } } }, orderBy: { createdAt: "desc" } });
  }

  order(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: { attempts: { include: { channel: true } }, refunds: true, channel: true } });
  }

  async wallet() {
    const merchant = await this.demoMerchant();
    return this.prisma.wallet.findUnique({ where: { merchantId: merchant.id } });
  }

  async transactions() {
    const merchant = await this.demoMerchant();
    return this.prisma.walletTransaction.findMany({ where: { merchantId: merchant.id }, orderBy: { createdAt: "desc" } });
  }

  async createWithdraw(body: Record<string, unknown>) {
    const merchant = await this.demoMerchant();
    const amount = new Prisma.Decimal(String(body.amount));
    const rule = await this.resolveWithdrawRule(merchant.id, merchant.agentId, String(body.currency ?? "USD"));
    if (amount.lt(rule.minAmount)) {
      throw new BadRequestException("WITHDRAW_AMOUNT_TOO_LOW");
    }
    if (amount.gt(rule.maxAmount)) {
      throw new BadRequestException("WITHDRAW_AMOUNT_TOO_HIGH");
    }
    const feeAmount = amount.mul(rule.withdrawFeeRate).plus(rule.withdrawFixedFee);
    const actualPayout = amount.sub(feeAmount);
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { merchantId: merchant.id } });
      if (!wallet || wallet.availableBalance.lt(amount)) {
        throw new BadRequestException("1008 Insufficient balance");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      });
      const withdraw = await tx.withdraw.create({
        data: {
          merchantId: merchant.id,
          withdrawNo: `W${new Date().getFullYear()}${nanoid(10).toUpperCase()}`,
          amount,
          feeAmount,
          actualPayout,
          currency: String(body.currency ?? "USD"),
          bankName: String(body.bankName),
          bankAccount: String(body.bankAccount),
          accountName: String(body.accountName),
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          merchantId: merchant.id,
          type: "WITHDRAW_FREEZE",
          amount,
          balanceAfter: updatedWallet.availableBalance,
          referenceType: "WITHDRAW",
          referenceId: withdraw.id,
          description: `Withdraw requested ${withdraw.withdrawNo}; fee ${feeAmount.toFixed(2)}; payout ${actualPayout.toFixed(2)}`,
        },
      });
      return withdraw;
    });
  }

  async withdraws() {
    const merchant = await this.demoMerchant();
    return this.prisma.withdraw.findMany({ where: { merchantId: merchant.id }, orderBy: { createdAt: "desc" } });
  }

  async paymentMethods() {
    const merchant = await this.demoMerchant();
    const [merchantChannels, withdrawRule] = await Promise.all([
      this.prisma.merchantChannel.findMany({ where: { merchantId: merchant.id, isEnabled: true }, include: { channel: true }, orderBy: [{ isPrimary: "desc" }, { isBackup: "desc" }] }),
      this.resolveWithdrawRule(merchant.id, merchant.agentId, "USD"),
    ]);
    return { merchant, channels: merchantChannels, withdrawRule };
  }

  async withdrawRules() {
    const merchant = await this.demoMerchant();
    return this.resolveWithdrawRule(merchant.id, merchant.agentId, "USD");
  }

  async apiKeys() {
    const merchant = await this.demoMerchant();
    return this.prisma.apiKey.findMany({ where: { merchantId: merchant.id } });
  }

  async regenerateApiKey() {
    const merchant = await this.demoMerchant();
    return this.prisma.apiKey.create({
      data: {
        merchantId: merchant.id,
        apiKey: `pk_${nanoid(24)}`,
        apiSecretHash: `sk_${nanoid(32)}`,
      },
    });
  }

  async webhooks() {
    const merchant = await this.demoMerchant();
    return this.prisma.webhook.findMany({ where: { merchantId: merchant.id } });
  }

  async webhookLogs() {
    const merchant = await this.demoMerchant();
    return this.prisma.webhookLog.findMany({
      where: { merchantId: merchant.id },
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createWebhook(body: { url: string; secret?: string }) {
    const merchant = await this.demoMerchant();
    return this.prisma.webhook.create({
      data: {
        merchantId: merchant.id,
        url: body.url,
        secret: body.secret ?? `whsec_${nanoid(24)}`,
      },
    });
  }

  updateWebhook(id: string, body: Record<string, unknown>) {
    return this.prisma.webhook.update({ where: { id }, data: body as Prisma.WebhookUpdateInput });
  }

  plugins() {
    return this.prisma.plugin.findMany({ include: { versions: true } });
  }

  sdk() {
    return [
      { language: "PHP", package: "payhub/payhub-php", version: "1.1.0" },
      { language: "Node.js", package: "@payhub/sdk", version: "1.1.0" },
      { language: "Java", package: "com.payhub:sdk", version: "1.1.0" },
      { language: "Python", package: "payhub-sdk", version: "1.1.0" },
    ];
  }

  private async resolveWithdrawRule(merchantId: string, agentId: string | null, currency: string) {
    const merchantRule = await this.prisma.withdrawRule.findUnique({ where: { merchantId_currency: { merchantId, currency } } });
    if (merchantRule) {
      return merchantRule;
    }
    if (agentId) {
      const agentRule = await this.prisma.withdrawRule.findUnique({ where: { agentId_currency: { agentId, currency } } });
      if (agentRule) {
        return agentRule;
      }
    }
    const globalRule = await this.prisma.withdrawRule.findFirst({ where: { merchantId: null, agentId: null, currency, status: "ACTIVE" } });
    if (globalRule) {
      return globalRule;
    }
    return {
      minAmount: new Prisma.Decimal("1"),
      maxAmount: new Prisma.Decimal("10000"),
      withdrawFeeRate: new Prisma.Decimal("0.01"),
      withdrawFixedFee: new Prisma.Decimal("0"),
    };
  }
}
