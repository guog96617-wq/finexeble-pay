import { BadRequestException, Injectable } from "@nestjs/common";
import { PaymentMethod, Prisma, SupplierStatus, WithdrawStatus } from "@prisma/client";
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
      include: {
        agent: true,
        users: true,
        orders: true,
        wallet: true,
        apiKeys: true,
        webhooks: true,
        merchantChannels: { include: { channel: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      },
    });
  }

  setMerchantChannelsStatus(id: string, isEnabled: boolean) {
    return this.prisma.$transaction(async (tx) => {
      await tx.merchantChannel.updateMany({ where: { merchantId: id }, data: { isEnabled } });
      const merchant = await tx.merchant.findUnique({ where: { id }, include: { merchantChannels: { include: { channel: true } }, wallet: true } });
      await tx.auditLog.create({ data: { action: isEnabled ? "admin.merchant_channels.enable_all" : "admin.merchant_channels.disable_all", module: "channels", afterData: { merchantId: id, isEnabled } } });
      return merchant;
    });
  }

  updateMerchant(id: string, body: Record<string, unknown>) {
    return this.prisma.merchant.update({ where: { id }, data: body as Prisma.MerchantUpdateInput });
  }

  listAgents() {
    return this.prisma.agent.findMany({ include: { merchants: true, agentChannels: { include: { channel: true } } }, orderBy: { createdAt: "desc" } });
  }

  async getAgent(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        merchants: { include: { orders: true, wallet: true } },
        agentChannels: { include: { channel: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!agent) {
      throw new BadRequestException("Agent not found");
    }
    const paidOrders = agent.merchants.flatMap((merchant) => merchant.orders.filter((order) => order.status === "PAID"));
    const todayVolume = paidOrders.reduce((sum, order) => sum + Number(order.amount), 0);
    const todayProfit = paidOrders.reduce((sum, order) => sum + Number(order.agentProfitAmount), 0);
    return {
      ...agent,
      metrics: {
        merchantCount: agent.merchants.length,
        todayVolume: todayVolume.toFixed(2),
        todayProfit: todayProfit.toFixed(2),
        authorizedChannelCount: agent.agentChannels.length,
      },
    };
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

  async getSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id }, include: { channels: true } });
    if (!supplier) {
      throw new BadRequestException("PSP not found");
    }
    return supplier;
  }

  createSupplier(body: Record<string, unknown>) {
    if (!body.name) {
      throw new BadRequestException("PSP name is required");
    }
    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({
        data: {
          name: String(body.name),
          country: body.country ? String(body.country) : undefined,
          contactName: body.contactName ? String(body.contactName) : undefined,
          email: body.email ? String(body.email) : undefined,
          apiBaseUrl: String(body.apiBaseUrl ?? "https://mock-psp.local"),
          status: this.supplierStatus(body.status),
        },
      });
      await tx.auditLog.create({ data: { action: "admin.psp.create", module: "psp", afterData: supplier } });
      return supplier;
    });
  }

  updateSupplier(id: string, body: Record<string, unknown>) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.supplier.findUnique({ where: { id } });
      if (!before) {
        throw new BadRequestException("PSP not found");
      }
      const supplier = await tx.supplier.update({
        where: { id },
        data: {
          name: body.name ? String(body.name) : undefined,
          country: body.country ? String(body.country) : undefined,
          contactName: body.contactName ? String(body.contactName) : undefined,
          email: body.email ? String(body.email) : undefined,
          apiBaseUrl: body.apiBaseUrl ? String(body.apiBaseUrl) : undefined,
          status: body.status ? this.supplierStatus(body.status) : undefined,
        },
      });
      await tx.auditLog.create({ data: { action: "admin.psp.update", module: "psp", beforeData: before ?? undefined, afterData: supplier } });
      return supplier;
    });
  }

  setSupplierStatus(id: string, status: SupplierStatus) {
    return this.updateSupplier(id, { status });
  }

  listMerchantPspStatus() {
    return this.prisma.merchant.findMany({
      include: {
        agent: true,
        merchantChannels: { include: { channel: { include: { supplier: true } } }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  merchantPspStatus(id: string) {
    return this.prisma.merchant.findUnique({
      where: { id },
      include: {
        agent: true,
        merchantChannels: { include: { channel: { include: { supplier: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
  }

  upsertMerchantChannel(merchantId: string, channelId: string, body: Record<string, unknown>) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.merchantChannel.upsert({
        where: { merchantId_channelId: { merchantId, channelId } },
        update: this.merchantChannelData(body),
        create: {
          merchantId,
          channelId,
          ...this.merchantChannelData(body),
        } as any,
        include: { channel: { include: { supplier: true } }, merchant: true },
      });
      await tx.auditLog.create({ data: { action: "admin.merchant_channel.upsert", module: "psp", afterData: result } });
      return result;
    });
  }

  listAgentFeeRules() {
    return this.prisma.agentFeeRule.findMany({ include: { agent: true }, orderBy: { createdAt: "desc" } });
  }

  upsertAgentFeeRule(agentId: string, body: Record<string, unknown>) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.agentFeeRule.upsert({
        where: { agentId },
        update: this.agentFeeRuleData(body),
        create: {
          agentId,
          ...this.agentFeeRuleData(body),
        } as any,
        include: { agent: true },
      });
      await tx.auditLog.create({ data: { action: "admin.agent_fee_rule.upsert", module: "fee_rules", afterData: result } });
      return result;
    });
  }

  listWithdrawRules() {
    return this.prisma.withdrawRule.findMany({ include: { merchant: true, agent: true }, orderBy: { createdAt: "desc" } });
  }

  upsertWithdrawRule(body: Record<string, unknown>) {
    const merchantId = body.merchantId ? String(body.merchantId) : null;
    const agentId = body.agentId ? String(body.agentId) : null;
    const currency = String(body.currency ?? "USD");
    return this.prisma.$transaction(async (tx) => {
      const where = merchantId ? { merchantId_currency: { merchantId, currency } } : { agentId_currency: { agentId: agentId ?? "", currency } };
      const result = await tx.withdrawRule.upsert({
        where,
        update: this.withdrawRuleData(body),
        create: {
          merchantId,
          agentId,
          currency,
          ...this.withdrawRuleData(body),
        } as any,
        include: { merchant: true, agent: true },
      });
      await tx.auditLog.create({ data: { action: "admin.withdraw_rule.upsert", module: "withdraw_rules", afterData: result } });
      return result;
    });
  }

  createSupplierLegacy(body: Record<string, unknown>) {
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
    return this.prisma.channel.findMany({
      include: {
        supplier: true,
        agentChannels: true,
        merchantChannels: true,
        orders: { where: { status: "PAID" } },
      },
      orderBy: [{ priority: "asc" }],
    });
  }

  async getChannel(id: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id }, include: { supplier: true, agentChannels: true, merchantChannels: true } });
    if (!channel) {
      throw new BadRequestException("Channel not found");
    }
    return channel;
  }

  createChannel(body: Record<string, unknown>) {
    if (!body.name) {
      throw new BadRequestException("Channel name is required");
    }
    return this.prisma.$transaction(async (tx) => {
      const channel = await tx.channel.create({ data: this.channelData(body) as any });
      await tx.auditLog.create({ data: { action: "admin.channel.create", module: "channels", afterData: channel } });
      return channel;
    });
  }

  updateChannel(id: string, body: Record<string, unknown>) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.channel.findUnique({ where: { id } });
      if (!before) {
        throw new BadRequestException("Channel not found");
      }
      const channel = await tx.channel.update({ where: { id }, data: this.channelData(body, true) });
      await tx.auditLog.create({ data: { action: "admin.channel.update", module: "channels", beforeData: before ?? undefined, afterData: channel } });
      return channel;
    });
  }

  async upsertAgentChannel(agentId: string, channelId: string, body: Record<string, unknown>) {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new BadRequestException("Channel not found");
    }
    const agentFeeRate = new Prisma.Decimal(String(body.agentFeeRate ?? channel.pspCostRate));
    if (agentFeeRate.lt(channel.pspCostRate)) {
      throw new BadRequestException("Agent channel fee rate cannot be lower than channel PSP cost rate.");
    }
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.agentChannel.upsert({
        where: { agentId_channelId: { agentId, channelId } },
        update: this.agentChannelData(body, channel.pspCostRate),
        create: {
          agentId,
          channelId,
          ...this.agentChannelData(body, channel.pspCostRate),
        } as any,
        include: { agent: true, channel: true },
      });
      await tx.auditLog.create({ data: { action: "admin.agent_channel.upsert", module: "channels", afterData: JSON.parse(JSON.stringify(result)) } });
      return result;
    });
  }

  async removeAgentChannel(agentId: string, channelId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.agentChannel.delete({ where: { agentId_channelId: { agentId, channelId } } });
      await tx.auditLog.create({ data: { action: "admin.agent_channel.remove", module: "channels", afterData: { agentId, channelId } } });
      return { agentId, channelId, removed: true };
    });
  }

  async setGlobalChannelRole(id: string, role: "primary" | "backup") {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (!channel) {
      throw new BadRequestException("Channel not found");
    }
    return this.prisma.$transaction(async (tx) => {
      if (role === "primary") {
        await tx.channel.updateMany({ where: { currency: channel.currency }, data: { isPrimary: false } });
      }
      if (role === "backup") {
        await tx.channel.updateMany({ where: { currency: channel.currency }, data: { isBackup: false } });
      }
      const updated = await tx.channel.update({
        where: { id },
        data: role === "primary" ? { isPrimary: true, isBackup: false } : { isBackup: true, isPrimary: false },
      });
      await tx.auditLog.create({ data: { action: `admin.channel.set_${role}`, module: "psp", afterData: updated } });
      return updated;
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
    return this.prisma.withdraw.findMany({ include: { merchant: true, agent: true, withdrawAddress: true }, orderBy: { createdAt: "desc" } });
  }

  async reviewWithdraw(id: string, status: WithdrawStatus) {
    return this.prisma.$transaction(async (tx) => {
      const withdraw = await tx.withdraw.findUnique({ where: { id } });
      if (!withdraw) {
        throw new Error("Withdraw not found");
      }

      const wallet = withdraw.ownerType === "AGENT" && withdraw.agentId
        ? await tx.wallet.findUnique({ where: { agentId: withdraw.agentId } })
        : withdraw.merchantId
          ? await tx.wallet.findUnique({ where: { merchantId: withdraw.merchantId } })
          : null;
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
            balance: { increment: withdraw.amount },
            availableBalance: { increment: withdraw.amount },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            ownerType: withdraw.ownerType,
            merchantId: withdraw.merchantId,
            agentId: withdraw.agentId,
            type: "WITHDRAW_REJECT_REFUND",
            amount: withdraw.amount,
            balanceAfter: updatedWallet.availableBalance,
            referenceType: "WITHDRAW",
            referenceId: withdraw.id,
            description: `Withdraw rejected ${withdraw.withdrawNo}`,
          },
        });
      }

      if (status === "PAID") {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            ownerType: withdraw.ownerType,
            merchantId: withdraw.merchantId,
            agentId: withdraw.agentId,
            type: "WITHDRAW_PAID",
            amount: withdraw.amount,
            balanceAfter: wallet.availableBalance,
            referenceType: "WITHDRAW",
            referenceId: withdraw.id,
            description: `Withdraw paid ${withdraw.withdrawNo}`,
          },
        });
      }

      if (status === "APPROVED") {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            ownerType: withdraw.ownerType,
            merchantId: withdraw.merchantId,
            agentId: withdraw.agentId,
            type: "WITHDRAW_APPROVED",
            amount: withdraw.amount,
            balanceAfter: wallet.availableBalance,
            referenceType: "WITHDRAW",
            referenceId: withdraw.id,
            description: `Withdraw approved ${withdraw.withdrawNo}`,
          },
        });
      }

      const updated = await tx.withdraw.update({
        where: { id },
        data: { status, reviewedAt: new Date(), reviewedBy: "system-admin", processedAt: new Date(), processedBy: "system-admin" },
      });
      await tx.auditLog.create({
        data: {
          action: `admin.withdraw.${status.toLowerCase()}`,
          module: "withdraws",
          afterData: {
            id: withdraw.id,
            withdrawNo: withdraw.withdrawNo,
            ownerType: withdraw.ownerType,
            ownerId: withdraw.ownerId,
            status,
          },
        },
      });
      return updated;
    });
  }

  listSettlementRecords() {
    return this.prisma.settlementRecord.findMany({
      include: { merchant: true, agent: true, order: true },
      orderBy: [{ status: "asc" }, { releaseAt: "asc" }],
    });
  }

  async releaseDueSettlements(now = new Date()) {
    const due = await this.prisma.settlementRecord.findMany({
      where: { status: "FROZEN", releaseAt: { lte: now } },
      orderBy: { releaseAt: "asc" },
    });
    const released = [];
    for (const record of due) {
      const result = await this.prisma.$transaction(async (tx) => {
        const current = await tx.settlementRecord.findUnique({ where: { id: record.id } });
        if (!current || current.status !== "FROZEN" || current.releaseAt > now) {
          return null;
        }
        const wallet = current.ownerType === "AGENT" && current.agentId
          ? await tx.wallet.findUnique({ where: { agentId: current.agentId } })
          : current.merchantId
            ? await tx.wallet.findUnique({ where: { merchantId: current.merchantId } })
            : null;
        if (!wallet) {
          throw new BadRequestException("SETTLEMENT_WALLET_NOT_FOUND");
        }
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            frozenBalance: { decrement: current.amount },
            availableBalance: { increment: current.amount },
          },
        });
        const updatedRecord = await tx.settlementRecord.update({
          where: { id: current.id },
          data: { status: "RELEASED", releasedAt: now },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            ownerType: current.ownerType,
            merchantId: current.merchantId,
            agentId: current.agentId,
            type: "SETTLEMENT_RELEASE",
            amount: current.amount,
            balanceAfter: updatedWallet.availableBalance,
            referenceType: "SETTLEMENT",
            referenceId: current.id,
            description: `T+${current.settlementDays} settlement released`,
          },
        });
        return updatedRecord;
      });
      if (result) {
        released.push(result);
      }
    }
    return { scanned: due.length, released };
  }

  listPlugins() {
    return this.prisma.plugin.findMany({ include: { versions: true }, orderBy: { createdAt: "desc" } });
  }

  listUsers() {
    return this.prisma.user.findMany({
      include: { merchant: true, agent: true },
      orderBy: { createdAt: "desc" },
    });
  }

  listSystemConfigs() {
    return this.prisma.systemConfig.findMany({ orderBy: { configKey: "asc" } });
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

  private supplierStatus(value: unknown): SupplierStatus {
    return value === "DISABLED" ? "DISABLED" : "ACTIVE";
  }

  private channelData(body: Record<string, unknown>, partial = false): Prisma.ChannelUncheckedCreateInput | Prisma.ChannelUncheckedUpdateInput {
    return {
      supplierId: body.supplierId ? String(body.supplierId) : undefined,
      name: body.name || partial ? (body.name ? String(body.name) : undefined) : String(body.name),
      supplierName: body.supplierName ? String(body.supplierName) : partial ? undefined : "Mock Supplier",
      supplierContactName: body.supplierContactName ? String(body.supplierContactName) : undefined,
      supplierApiBaseUrl: body.supplierApiBaseUrl ? String(body.supplierApiBaseUrl) : undefined,
      supplierNote: body.supplierNote ? String(body.supplierNote) : undefined,
      paymentMethod: body.paymentMethod ? this.paymentMethod(body.paymentMethod) : partial ? undefined : "CARD",
      country: body.country ? String(body.country) : undefined,
      currency: body.currency ? String(body.currency) : partial ? undefined : "USD",
      feeRate: body.feeRate !== undefined ? new Prisma.Decimal(String(body.feeRate)) : partial ? undefined : new Prisma.Decimal("0.02"),
      pspCostRate: body.pspCostRate !== undefined ? new Prisma.Decimal(String(body.pspCostRate)) : body.feeRate !== undefined ? new Prisma.Decimal(String(body.feeRate)) : partial ? undefined : new Prisma.Decimal("0.02"),
      pspFixedFee: body.pspFixedFee !== undefined ? new Prisma.Decimal(String(body.pspFixedFee)) : partial ? undefined : new Prisma.Decimal("0"),
      rollingReserveRate: body.rollingReserveRate !== undefined ? new Prisma.Decimal(String(body.rollingReserveRate)) : partial ? undefined : new Prisma.Decimal("0"),
      rollingReserveDays: body.rollingReserveDays !== undefined ? Number(body.rollingReserveDays) : partial ? undefined : 0,
      settlementDays: body.settlementDays !== undefined ? this.settlementDays(body.settlementDays) : partial ? undefined : 0,
      settlementType: body.settlementDays !== undefined ? `T+${this.settlementDays(body.settlementDays)}` : body.settlementType ? this.settlementType(body.settlementType) : partial ? undefined : "T+0",
      description: body.description ? String(body.description) : undefined,
      priority: body.priority !== undefined ? Number(body.priority) : partial ? undefined : 100,
      isPrimary: body.isPrimary !== undefined ? Boolean(body.isPrimary) : partial ? undefined : false,
      isBackup: body.isBackup !== undefined ? Boolean(body.isBackup) : partial ? undefined : false,
      status: body.status ? this.supplierStatus(body.status) : partial ? undefined : "ACTIVE",
    };
  }

  private merchantChannelData(body: Record<string, unknown>): Prisma.MerchantChannelUncheckedUpdateInput {
    return {
      isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : true,
      isPrimary: body.isPrimary !== undefined ? Boolean(body.isPrimary) : false,
      isBackup: body.isBackup !== undefined ? Boolean(body.isBackup) : false,
      merchantFeeRate: body.merchantFeeRate !== undefined ? new Prisma.Decimal(String(body.merchantFeeRate)) : new Prisma.Decimal("0.029"),
      merchantFixedFee: body.merchantFixedFee !== undefined ? new Prisma.Decimal(String(body.merchantFixedFee)) : new Prisma.Decimal("0"),
      minFee: body.minFee !== undefined ? new Prisma.Decimal(String(body.minFee)) : new Prisma.Decimal("0"),
      maxFee: body.maxFee !== undefined && body.maxFee !== "" ? new Prisma.Decimal(String(body.maxFee)) : null,
    };
  }

  private agentChannelData(body: Record<string, unknown>, defaultRate: Prisma.Decimal): Prisma.AgentChannelUncheckedUpdateInput {
    return {
      isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : true,
      agentFeeRate: body.agentFeeRate !== undefined ? new Prisma.Decimal(String(body.agentFeeRate)) : defaultRate,
      agentFixedFee: body.agentFixedFee !== undefined ? new Prisma.Decimal(String(body.agentFixedFee)) : new Prisma.Decimal("0"),
      note: body.note ? String(body.note) : undefined,
    };
  }

  private agentFeeRuleData(body: Record<string, unknown>): Prisma.AgentFeeRuleUncheckedUpdateInput {
    return {
      minMerchantFeeRate: body.minMerchantFeeRate !== undefined ? new Prisma.Decimal(String(body.minMerchantFeeRate)) : new Prisma.Decimal("0.1"),
      minWithdrawFeeRate: body.minWithdrawFeeRate !== undefined ? new Prisma.Decimal(String(body.minWithdrawFeeRate)) : new Prisma.Decimal("0.01"),
      allowedPaymentMethods: body.allowedPaymentMethods ?? [],
      allowedSupplierIds: body.allowedSupplierIds ?? [],
      allowedChannelIds: body.allowedChannelIds ?? [],
    };
  }

  private withdrawRuleData(body: Record<string, unknown>): Prisma.WithdrawRuleUncheckedUpdateInput {
    return {
      minAmount: body.minAmount !== undefined ? new Prisma.Decimal(String(body.minAmount)) : new Prisma.Decimal("1"),
      maxAmount: body.maxAmount !== undefined ? new Prisma.Decimal(String(body.maxAmount)) : new Prisma.Decimal("10000"),
      withdrawFeeRate: body.withdrawFeeRate !== undefined ? new Prisma.Decimal(String(body.withdrawFeeRate)) : new Prisma.Decimal("0.01"),
      withdrawFixedFee: body.withdrawFixedFee !== undefined ? new Prisma.Decimal(String(body.withdrawFixedFee)) : new Prisma.Decimal("0"),
      settlementDays: body.settlementDays !== undefined ? Number(body.settlementDays) : 1,
      requireManualReview: body.requireManualReview !== undefined ? Boolean(body.requireManualReview) : true,
      status: body.status ? (String(body.status) as any) : "ACTIVE",
    };
  }

  private settlementDays(value: unknown) {
    const days = Number(value);
    if ([0, 1, 7].includes(days)) {
      return days;
    }
    throw new BadRequestException("SETTLEMENT_DAYS_INVALID");
  }

  private settlementType(value: unknown) {
    const type = String(value);
    if (type === "T+0" || type === "T+1" || type === "T+7") {
      return type;
    }
    throw new BadRequestException("SETTLEMENT_TYPE_INVALID");
  }
}
