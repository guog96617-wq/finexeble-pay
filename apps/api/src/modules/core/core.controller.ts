import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
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

  @Patch("merchants/:id/channels/disable-all")
  disableMerchantChannels(@Param("id") id: string) {
    return this.core.setMerchantChannelsStatus(id, false);
  }

  @Patch("merchants/:id/channels/enable-all")
  enableMerchantChannels(@Param("id") id: string) {
    return this.core.setMerchantChannelsStatus(id, true);
  }

  @Get("merchants/:id/psp")
  merchantPsp(@Param("id") id: string) {
    return this.core.merchantPspStatus(id);
  }

  @Post("merchants/:merchantId/channels/:channelId")
  upsertMerchantChannel(@Param("merchantId") merchantId: string, @Param("channelId") channelId: string, @Body() body: Record<string, unknown>) {
    return this.core.upsertMerchantChannel(merchantId, channelId, body);
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

  @Get("agents/:id")
  agent(@Param("id") id: string) {
    return this.core.getAgent(id);
  }

  @Post("agents/:agentId/channels/:channelId")
  authorizeAgentChannel(@Param("agentId") agentId: string, @Param("channelId") channelId: string, @Body() body: Record<string, unknown>) {
    return this.core.upsertAgentChannel(agentId, channelId, body);
  }

  @Patch("agents/:agentId/channels/:channelId")
  updateAgentChannel(@Param("agentId") agentId: string, @Param("channelId") channelId: string, @Body() body: Record<string, unknown>) {
    return this.core.upsertAgentChannel(agentId, channelId, body);
  }

  @Delete("agents/:agentId/channels/:channelId")
  removeAgentChannel(@Param("agentId") agentId: string, @Param("channelId") channelId: string) {
    return this.core.removeAgentChannel(agentId, channelId);
  }

  @Get("suppliers")
  suppliers() {
    return this.core.listSuppliers();
  }

  @Get("psp")
  psp() {
    return this.core.listSuppliers();
  }

  @Get("psp/:id")
  pspDetail(@Param("id") id: string) {
    return this.core.getSupplier(id);
  }

  @Get("suppliers/:id")
  supplierDetail(@Param("id") id: string) {
    return this.core.getSupplier(id);
  }

  @Post("suppliers")
  createSupplier(@Body() body: Record<string, unknown>) {
    return this.core.createSupplier(body);
  }

  @Post("psp")
  createPsp(@Body() body: Record<string, unknown>) {
    return this.core.createSupplier(body);
  }

  @Patch("suppliers/:id")
  updateSupplier(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.core.updateSupplier(id, body);
  }

  @Patch("psp/:id")
  updatePsp(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.core.updateSupplier(id, body);
  }

  @Patch("psp/:id/status")
  setPspStatus(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.core.setSupplierStatus(id, body.status === "DISABLED" ? "DISABLED" : "ACTIVE");
  }

  @Patch("suppliers/:id/enable")
  enableSupplier(@Param("id") id: string) {
    return this.core.setSupplierStatus(id, "ACTIVE");
  }

  @Patch("suppliers/:id/disable")
  disableSupplier(@Param("id") id: string) {
    return this.core.setSupplierStatus(id, "DISABLED");
  }

  @Get("channels")
  channels() {
    return this.core.listChannels();
  }

  @Get("channels/:id")
  channel(@Param("id") id: string) {
    return this.core.getChannel(id);
  }

  @Post("channels")
  createChannel(@Body() body: Record<string, unknown>) {
    return this.core.createChannel(body);
  }

  @Patch("channels/:id")
  updateChannel(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.core.updateChannel(id, body);
  }

  @Patch("channels/:id/enable")
  enableChannel(@Param("id") id: string) {
    return this.core.updateChannel(id, { status: "ACTIVE" });
  }

  @Patch("channels/:id/disable")
  disableChannel(@Param("id") id: string) {
    return this.core.updateChannel(id, { status: "DISABLED" });
  }

  @Patch("channels/:id/status")
  setChannelStatus(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.core.updateChannel(id, { status: body.status === "DISABLED" ? "DISABLED" : "ACTIVE" });
  }

  @Patch("channels/:id/primary")
  setPrimaryChannel(@Param("id") id: string) {
    return this.core.setGlobalChannelRole(id, "primary");
  }

  @Patch("channels/:id/backup")
  setBackupChannel(@Param("id") id: string) {
    return this.core.setGlobalChannelRole(id, "backup");
  }

  @Get("merchant-psp-status")
  merchantPspStatus() {
    return this.core.listMerchantPspStatus();
  }

  @Get("agent-fee-rules")
  agentFeeRules() {
    return this.core.listAgentFeeRules();
  }

  @Post("agents/:agentId/fee-rules")
  upsertAgentFeeRule(@Param("agentId") agentId: string, @Body() body: Record<string, unknown>) {
    return this.core.upsertAgentFeeRule(agentId, body);
  }

  @Get("withdraw-rules")
  withdrawRules() {
    return this.core.listWithdrawRules();
  }

  @Post("withdraw-rules")
  upsertWithdrawRule(@Body() body: Record<string, unknown>) {
    return this.core.upsertWithdrawRule(body);
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

  @Get("users")
  users() {
    return this.core.listUsers();
  }

  @Get("system-configs")
  systemConfigs() {
    return this.core.listSystemConfigs();
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
