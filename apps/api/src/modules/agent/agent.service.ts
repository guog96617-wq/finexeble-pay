import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  private async demoAgent() {
    const agent = await this.prisma.agent.findFirst({ where: { status: "ACTIVE" } });
    if (!agent) {
      throw new BadRequestException("No active agent seeded");
    }
    return agent;
  }

  async dashboard() {
    const agent = await this.demoAgent();
    const merchants = await this.prisma.merchant.findMany({ where: { agentId: agent.id }, include: { orders: true } });
    const volume = merchants
      .flatMap((merchant) => merchant.orders)
      .reduce((sum, order) => sum + Number(order.amount), 0);
    return {
      merchantCount: merchants.length,
      todayVolume: "8450.00",
      totalVolume: volume.toFixed(2),
      commissionIncome: (volume * Number(agent.commissionRate)).toFixed(2),
    };
  }

  async merchants() {
    const agent = await this.demoAgent();
    return this.prisma.merchant.findMany({ where: { agentId: agent.id }, include: { wallet: true, merchantChannels: { include: { channel: true } } } });
  }

  async merchant(id: string) {
    const agent = await this.demoAgent();
    const merchant = await this.prisma.merchant.findFirst({
      where: { id, agentId: agent.id },
      include: {
        wallet: true,
        orders: true,
        merchantChannels: { include: { channel: true }, orderBy: [{ isPrimary: "desc" }, { isBackup: "desc" }, { createdAt: "asc" }] },
      },
    });
    if (!merchant) {
      throw new BadRequestException("AGENT_MERCHANT_FORBIDDEN");
    }
    const agentChannels = await this.prisma.agentChannel.findMany({
      where: { agentId: agent.id, isEnabled: true, channel: { status: "ACTIVE" } },
      include: { channel: true },
      orderBy: { createdAt: "desc" },
    });
    return { agent, merchant, agentChannels };
  }

  async orders() {
    const agent = await this.demoAgent();
    return this.prisma.order.findMany({
      where: { merchant: { agentId: agent.id } },
      include: { merchant: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async commissions() {
    const agent = await this.demoAgent();
    const orders = await this.prisma.order.findMany({ where: { merchant: { agentId: agent.id }, status: "PAID" } });
    return orders.map((order) => ({
      orderNo: order.orderNo,
      amount: order.amount,
      channelCost: order.merchantNetBeforeReserve,
      commissionAmount: order.agentProfitAmount,
      createdAt: order.createdAt,
    }));
  }

  async paymentMethods() {
    const agent = await this.demoAgent();
    return this.prisma.agentChannel.findMany({
      where: { agentId: agent.id },
      include: { channel: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async feeRules() {
    const agent = await this.demoAgent();
    const [rule, merchants, channels] = await Promise.all([
      this.prisma.agentFeeRule.findUnique({ where: { agentId: agent.id } }),
      this.prisma.merchant.findMany({ where: { agentId: agent.id }, include: { merchantChannels: { include: { channel: true } } } }),
      this.prisma.agentChannel.findMany({ where: { agentId: agent.id, isEnabled: true }, include: { channel: true }, orderBy: { createdAt: "desc" } }),
    ]);
    return { agent, rule, merchants, channels };
  }

  async upsertMerchantChannel(merchantId: string, channelId: string, body: Record<string, unknown>) {
    const agent = await this.demoAgent();
    const merchant = await this.prisma.merchant.findFirst({ where: { id: merchantId, agentId: agent.id } });
    if (!merchant) {
      throw new BadRequestException("AGENT_MERCHANT_FORBIDDEN");
    }
    const agentChannel = await this.assertChannelAllowed(agent.id, channelId);
    const merchantFeeRate = new Prisma.Decimal(String(body.merchantFeeRate ?? agentChannel.agentFeeRate));
    if (merchantFeeRate.lt(agentChannel.agentFeeRate)) {
      throw new BadRequestException("MERCHANT_FEE_TOO_LOW");
    }
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.merchantChannel.upsert({
        where: { merchantId_channelId: { merchantId, channelId } },
        update: this.merchantChannelData(body),
        create: {
          merchantId,
          channelId,
          ...this.merchantChannelData(body),
        } as any,
        include: { merchant: true, channel: { include: { supplier: true } } },
      });
      await tx.auditLog.create({ data: { action: "agent.merchant_channel.upsert", module: "channels", afterData: this.safeJson(result) } });
      return result;
    });
  }

  async setMerchantFee(merchantId: string, channelId: string, body: Record<string, unknown>) {
    const agent = await this.demoAgent();
    const agentChannel = await this.assertChannelAllowed(agent.id, channelId);
    const minMerchantFeeRate = new Prisma.Decimal(agentChannel.agentFeeRate);
    const nextRate = new Prisma.Decimal(String(body.merchantFeeRate ?? "0"));
    if (nextRate.lt(minMerchantFeeRate)) {
      throw new BadRequestException("MERCHANT_FEE_TOO_LOW");
    }
    return this.upsertMerchantChannel(merchantId, channelId, body);
  }

  async upsertMerchantWithdrawRule(merchantId: string, body: Record<string, unknown>) {
    const agent = await this.demoAgent();
    const merchant = await this.prisma.merchant.findFirst({ where: { id: merchantId, agentId: agent.id } });
    if (!merchant) {
      throw new BadRequestException("AGENT_MERCHANT_FORBIDDEN");
    }
    const rule = await this.prisma.agentFeeRule.findUnique({ where: { agentId: agent.id } });
    const minWithdrawFeeRate = new Prisma.Decimal(rule?.minWithdrawFeeRate ?? "0");
    const nextRate = new Prisma.Decimal(String(body.withdrawFeeRate ?? "0"));
    if (nextRate.lt(minWithdrawFeeRate)) {
      throw new BadRequestException("WITHDRAW_FEE_TOO_LOW");
    }
    const currency = String(body.currency ?? "USD");
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.withdrawRule.upsert({
        where: { merchantId_currency: { merchantId, currency } },
        update: this.withdrawRuleData(body),
        create: {
          merchantId,
          currency,
          ...this.withdrawRuleData(body),
        } as any,
        include: { merchant: true },
      });
      await tx.auditLog.create({ data: { action: "agent.withdraw_rule.upsert", module: "withdraw_rules", afterData: this.safeJson(result) } });
      return result;
    });
  }

  private async assertChannelAllowed(agentId: string, channelId: string) {
    const agentChannel = await this.prisma.agentChannel.findUnique({ where: { agentId_channelId: { agentId, channelId } } });
    if (!agentChannel || !agentChannel.isEnabled) {
      throw new BadRequestException("AGENT_CHANNEL_FORBIDDEN");
    }
    return agentChannel;
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

  private withdrawRuleData(body: Record<string, unknown>): Prisma.WithdrawRuleUncheckedUpdateInput {
    return {
      minAmount: body.minAmount !== undefined ? new Prisma.Decimal(String(body.minAmount)) : new Prisma.Decimal("1"),
      maxAmount: body.maxAmount !== undefined ? new Prisma.Decimal(String(body.maxAmount)) : new Prisma.Decimal("10000"),
      withdrawFeeRate: body.withdrawFeeRate !== undefined ? new Prisma.Decimal(String(body.withdrawFeeRate)) : new Prisma.Decimal("0.01"),
      withdrawFixedFee: body.withdrawFixedFee !== undefined ? new Prisma.Decimal(String(body.withdrawFixedFee)) : new Prisma.Decimal("0"),
      settlementDays: body.settlementDays !== undefined ? Number(body.settlementDays) : 1,
      requireManualReview: body.requireManualReview !== undefined ? Boolean(body.requireManualReview) : true,
    };
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
