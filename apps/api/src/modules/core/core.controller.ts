import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CoreService } from "./core.service";

@ApiTags("admin")
@Controller("admin")
export class CoreController {
  constructor(private readonly core: CoreService) {}

  @Get("dashboard")
  dashboard() {
    return this.core.dashboard();
  }

  @Get("merchants")
  merchants() {
    return this.core.listMerchants();
  }

  @Post("merchants")
  createMerchant(@Body() body: Record<string, unknown>) {
    return this.core.createMerchant(body);
  }

  @Get("merchants/:id")
  merchant(@Param("id") id: string) {
    return this.core.getMerchant(id);
  }

  @Patch("merchants/:id")
  updateMerchant(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.core.updateMerchant(id, body);
  }

  @Get("agents")
  agents() {
    return this.core.listAgents();
  }

  @Post("agents")
  createAgent(@Body() body: Record<string, unknown>) {
    return this.core.createAgent(body);
  }

  @Get("suppliers")
  suppliers() {
    return this.core.listSuppliers();
  }

  @Post("suppliers")
  createSupplier(@Body() body: Record<string, unknown>) {
    return this.core.createSupplier(body);
  }

  @Get("channels")
  channels() {
    return this.core.listChannels();
  }

  @Post("channels")
  createChannel(@Body() body: Record<string, unknown>) {
    return this.core.createChannel(body);
  }

  @Get("orders")
  orders() {
    return this.core.listOrders();
  }

  @Get("orders/:id")
  order(@Param("id") id: string) {
    return this.core.getOrder(id);
  }

  @Get("withdraws")
  withdraws() {
    return this.core.listWithdraws();
  }

  @Patch("withdraws/:id/approve")
  approveWithdraw(@Param("id") id: string) {
    return this.core.reviewWithdraw(id, "APPROVED");
  }

  @Patch("withdraws/:id/reject")
  rejectWithdraw(@Param("id") id: string) {
    return this.core.reviewWithdraw(id, "REJECTED");
  }

  @Patch("withdraws/:id/paid")
  paidWithdraw(@Param("id") id: string) {
    return this.core.reviewWithdraw(id, "PAID");
  }

  @Get("plugins")
  plugins() {
    return this.core.listPlugins();
  }

  @Get("webhook-logs")
  webhookLogs() {
    return this.core.listWebhookLogs();
  }

  @Get("audit-logs")
  auditLogs() {
    return this.core.listAuditLogs();
  }
}
