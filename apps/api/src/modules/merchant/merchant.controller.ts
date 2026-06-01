import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MerchantService } from "./merchant.service";

@ApiTags("merchant")
@Controller("merchant")
export class MerchantController {
  constructor(private readonly merchant: MerchantService) {}

  @Get("dashboard")
  dashboard() {
    return this.merchant.dashboard();
  }

  @Post("orders")
  createOrder(@Body() body: Record<string, unknown>) {
    return this.merchant.createManualOrder(body);
  }

  @Get("orders")
  orders() {
    return this.merchant.orders();
  }

  @Get("orders/:id")
  order(@Param("id") id: string) {
    return this.merchant.order(id);
  }

  @Get("wallet")
  wallet() {
    return this.merchant.wallet();
  }

  @Get("wallet/transactions")
  transactions() {
    return this.merchant.transactions();
  }

  @Get("payment-methods")
  paymentMethods() {
    return this.merchant.paymentMethods();
  }

  @Get("withdraw-rules")
  withdrawRules() {
    return this.merchant.withdrawRules();
  }

  @Post("withdraws")
  createWithdraw(@Body() body: Record<string, unknown>) {
    return this.merchant.createWithdraw(body);
  }

  @Get("withdraws")
  withdraws() {
    return this.merchant.withdraws();
  }

  @Get("api-keys")
  apiKeys() {
    return this.merchant.apiKeys();
  }

  @Post("api-keys/regenerate")
  regenerateApiKey() {
    return this.merchant.regenerateApiKey();
  }

  @Get("webhooks")
  webhooks() {
    return this.merchant.webhooks();
  }

  @Get("webhook-logs")
  webhookLogs() {
    return this.merchant.webhookLogs();
  }

  @Post("webhooks")
  createWebhook(@Body() body: { url: string; secret?: string }) {
    return this.merchant.createWebhook(body);
  }

  @Patch("webhooks/:id")
  updateWebhook(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.merchant.updateWebhook(id, body);
  }

  @Get("plugins")
  plugins() {
    return this.merchant.plugins();
  }

  @Get("sdk")
  sdk() {
    return this.merchant.sdk();
  }
}
