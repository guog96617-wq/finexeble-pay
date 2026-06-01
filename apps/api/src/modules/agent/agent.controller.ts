import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AgentService } from "./agent.service";

@ApiTags("agent")
@Controller("agent")
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  @Get("dashboard")
  dashboard() {
    return this.agent.dashboard();
  }

  @Get("merchants")
  merchants() {
    return this.agent.merchants();
  }

  @Get("orders")
  orders() {
    return this.agent.orders();
  }

  @Get("commissions")
  commissions() {
    return this.agent.commissions();
  }

  @Get("payment-methods")
  paymentMethods() {
    return this.agent.paymentMethods();
  }

  @Get("merchant-fees")
  feeRules() {
    return this.agent.feeRules();
  }

  @Post("merchants/:merchantId/channels/:channelId")
  upsertMerchantChannel(@Param("merchantId") merchantId: string, @Param("channelId") channelId: string, @Body() body: Record<string, unknown>) {
    return this.agent.upsertMerchantChannel(merchantId, channelId, body);
  }

  @Post("merchants/:merchantId/channels/:channelId/fees")
  setMerchantFee(@Param("merchantId") merchantId: string, @Param("channelId") channelId: string, @Body() body: Record<string, unknown>) {
    return this.agent.setMerchantFee(merchantId, channelId, body);
  }

  @Post("merchants/:merchantId/withdraw-rule")
  setMerchantWithdrawRule(@Param("merchantId") merchantId: string, @Body() body: Record<string, unknown>) {
    return this.agent.upsertMerchantWithdrawRule(merchantId, body);
  }
}
