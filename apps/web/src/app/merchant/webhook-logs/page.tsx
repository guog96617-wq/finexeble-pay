import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type WebhookLog = {
  id: string;
  status: string;
  url: string;
  responseStatus?: number | null;
  responseBody?: string | null;
  requestPayload?: { event?: string; orderNo?: string; status?: string } | null;
  createdAt: string;
  order?: { orderNo: string } | null;
};

export default async function MerchantWebhookLogsPage() {
  const logs = await apiGet<WebhookLog[]>("/api/merchant/webhook-logs", []);
  const rows = logs.map((log) => [
    log.order?.orderNo ?? log.requestPayload?.orderNo ?? "-",
    log.requestPayload?.event ?? "payment.success",
    <StatusBadge key={log.id} status={log.status} />,
    String(log.responseStatus ?? "-"),
    log.url,
    new Date(log.createdAt).toLocaleString(),
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Webhook Logs" role="Merchant Admin">
      <SectionHeader
        eyebrow="开发者"
        title="Webhook 日志"
        text="查看回调事件、响应状态和发送时间，方便商户核对支付通知。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索订单号、事件或响应状态" statusLabel="全部回调状态" />
      <DataTable
        columns={["订单号", "事件", "状态", "响应码", "Webhook URL", "时间"]}
        rows={rows}
        empty="暂无 Webhook 日志。"
      />
    </DashboardShell>
  );
}
