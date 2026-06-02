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

  @Get("merchants/:id")
  merchant(@Param("id") id: string) {
    return this.agent.merchant(id);
  }

  @Get("orders")
  orders() {
    return this.agent.orders();
  }

  @Get("commissions")
  commissions() {
    return this.agent.commissions();
  }

  @Get("wallet")
  wallet() {
    return this.agent.wallet();
  }

  @Get("wallet/transactions")
  transactions() {
    return this.agent.transactions();
  }

  @Get("wallet/withdraw-addresses")
  withdrawAddresses() {
    return this.agent.withdrawAddresses();
  }

  @Post("wallet/withdraw-addresses")
  createWithdrawAddress(@Body() body: Record<string, unknown>) {
    return this.agent.createWithdrawAddress(body);
  }

  @Get("wallet/settlements")
  settlementRecords() {
    return this.agent.settlementRecords();
  }

  @Post("withdraws")
  createWithdraw(@Body() body: Record<string, unknown>) {
    return this.agent.createWithdraw(body);
  }

  @Get("withdraws")
  withdraws() {
    return this.agent.withdraws();
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
