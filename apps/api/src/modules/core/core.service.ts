import { BadRequestException, Injectable } from "@nestjs/common";
import { PaymentMethod, Prisma, WithdrawStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CoreService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [orders, paidOrders, merchants, withdraws] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: "PAID" } }),
      this.prisma.merchant.count({ where: { status: "ACTIVE" } }),
      this.prisma.withdraw.count({ where: { status: "PENDING" } }),
    ]);

    return {
      todayVolume: "128450.00",
      todayOrders: orders,
      successRate: orders === 0 ? 0 : Number(((paidOrders / orders) * 100).toFixed(2)),
      activeMerchants: merchants,
      pendingWithdraws: withdraws,
    };
  }

  listMerchants() {
    return this.prisma.merchant.findMany({ include: { agent: true, wallet: true }, orderBy: { createdAt: "desc" } });
  }

  createMerchant(body: Record<string, unknown>) {
    return this.prisma.merchant.create({
      data: {
        name: String(body.name),
        contactName: String(body.contactName ?? body.name),
        email: String(body.email),
        phone: body.phone ? String(body.phone) : undefined,
        country: body.country ? String(body.country) : undefined,
        website: body.website ? String(body.website) : undefined,
        status: "PENDING",
        wallet: { create: { currency: String(body.currency ?? "USD") } },
      },
      include: { wallet: true },
    });
  }

  getMerchant(id: string) {
    return this.prisma.merchant.findUnique({
      where: { id },
      include: { agent: true, users: true, orders: true, wallet: true, apiKeys: true, webhooks: true },
    });
  }

  updateMerchant(id: string, body: Record<string, unknown>) {
    return this.prisma.merchant.update({ where: { id }, data: body as Prisma.MerchantUpdateInput });
  }

  listAgents() {
    return this.prisma.agent.findMany({ include: { merchants: true }, orderBy: { createdAt: "desc" } });
  }

  createAgent(body: Record<string, unknown>) {
    return this.prisma.agent.create({
      data: {
        name: String(body.name),
        contactName: String(body.contactName ?? body.name),
        email: String(body.email),
        phone: body.phone ? String(body.phone) : undefined,
        commissionRate: new Prisma.Decimal(String(body.commissionRate ?? "0.01")),
        status: "PENDING",
      },
    });
  }

  listSuppliers() {
    return this.prisma.supplier.findMany({ include: { channels: true }, orderBy: { createdAt: "desc" } });
  }

  createSupplier(body: Record<string, unknown>) {
    return this.prisma.supplier.create({
      data: {
        name: String(body.name),
        country: body.country ? String(body.country) : undefined,
        contactName: body.contactName ? String(body.contactName) : undefined,
        email: body.email ? String(body.email) : undefined,
        apiBaseUrl: String(body.apiBaseUrl ?? "https://mock-psp.local"),
      },
    });
  }

  listChannels() {
    return this.prisma.channel.findMany({ include: { supplier: true }, orderBy: [{ priority: "asc" }] });
  }

  createChannel(body: Record<string, unknown>) {
    return this.prisma.channel.create({
      data: {
        supplierId: String(body.supplierId),
        name: String(body.name),
        paymentMethod: this.paymentMethod(body.paymentMethod),
        country: body.country ? String(body.country) : undefined,
        currency: String(body.currency ?? "USD"),
        feeRate: new Prisma.Decimal(String(body.feeRate ?? "0.02")),
        priority: Number(body.priority ?? 100),
        isPrimary: Boolean(body.isPrimary),
        isBackup: Boolean(body.isBackup),
      },
    });
  }

  listOrders() {
    return this.prisma.order.findMany({ include: { merchant: true, channel: true, attempts: { include: { channel: true } } }, orderBy: { createdAt: "desc" } });
  }

  getOrder(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { merchant: true, channel: true, attempts: true, refunds: true, webhookLogs: true },
    });
  }

  listWithdraws() {
    return this.prisma.withdraw.findMany({ include: { merchant: true }, orderBy: { createdAt: "desc" } });
  }

  async reviewWithdraw(id: string, status: WithdrawStatus) {
    return this.prisma.$transaction(async (tx) => {
      const withdraw = await tx.withdraw.findUnique({ where: { id } });
      if (!withdraw) {
        throw new Error("Withdraw not found");
      }

      const wallet = await tx.wallet.findUnique({ where: { merchantId: withdraw.merchantId } });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (withdraw.status === "PAID" || withdraw.status === "REJECTED") {
        throw new BadRequestException("Withdraw is already finalized");
      }

      if (status === "PAID" && withdraw.status !== "APPROVED") {
        throw new BadRequestException("Withdraw must be approved before paid");
      }

      if (status === "REJECTED") {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: { increment: withdraw.amount },
            frozenBalance: { decrement: withdraw.amount },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            merchantId: withdraw.merchantId,
            type: "WITHDRAW_FAILED",
            amount: withdraw.amount,
            balanceAfter: updatedWallet.availableBalance,
            referenceType: "WITHDRAW",
            referenceId: withdraw.id,
            description: `Withdraw rejected ${withdraw.withdrawNo}`,
          },
        });
      }

      if (status === "PAID") {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: withdraw.amount },
            frozenBalance: { decrement: withdraw.amount },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            merchantId: withdraw.merchantId,
            type: "WITHDRAW_SUCCESS",
            amount: withdraw.amount,
            balanceAfter: updatedWallet.availableBalance,
            referenceType: "WITHDRAW",
            referenceId: withdraw.id,
            description: `Withdraw paid ${withdraw.withdrawNo}`,
          },
        });
      }

      return tx.withdraw.update({
        where: { id },
        data: { status, reviewedAt: new Date(), reviewedBy: "system-admin" },
      });
    });
  }

  listPlugins() {
    return this.prisma.plugin.findMany({ include: { versions: true }, orderBy: { createdAt: "desc" } });
  }

  listWebhookLogs() {
    return this.prisma.webhookLog.findMany({ include: { merchant: true, order: true }, orderBy: { createdAt: "desc" }, take: 100 });
  }

  listAuditLogs() {
    return this.prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 });
  }

  private paymentMethod(value: unknown): PaymentMethod {
    return Object.values(PaymentMethod).includes(value as PaymentMethod) ? (value as PaymentMethod) : "CARD";
  }
}
