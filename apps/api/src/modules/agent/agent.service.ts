import { BadRequestException, Injectable } from "@nestjs/common";
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
    return this.prisma.merchant.findMany({ where: { agentId: agent.id }, include: { wallet: true } });
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
      commissionRate: agent.commissionRate,
      commissionAmount: Number(order.amount) * Number(agent.commissionRate),
      createdAt: order.createdAt,
    }));
  }
}
