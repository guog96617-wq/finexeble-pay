import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type WebhookLog = {
  id?: string;
  status: string;
  url: string;
  responseStatus?: number | null;
  responseBody?: unknown;
  errorMessage?: string | null;
  requestPayload?: { event?: string; orderNo?: string; status?: string } | null;
  createdAt?: string;
  order?: { orderNo: string } | null;
};

export default async function AdminWebhooksPage() {
  const logs = await apiGet<WebhookLog[]>("/api/admin/webhook-logs", []);
  const failed = logs.filter((log) => log.status === "FAILED").length;
  const success = logs.length - failed;
  const successRate = logs.length === 0 ? 100 : Number(((success / logs.length) * 100).toFixed(2));
  const rows = logs.map((log, index) => [
    log.url,
    <StatusBadge key={`${index}-status`} status={log.status} />,
    `${successRate}%`,
    String(failed),
    String(log.responseStatus ?? "-"),
    log.errorMessage ?? "-",
    <div key={`${index}-actions`} className="flex flex-wrap gap-2">
      <button type="button" className="button secondary px-3 py-2 text-xs">Retry</button>
      <button type="button" className="button secondary px-3 py-2 text-xs">查看 Payload</button>
      <button type="button" className="button secondary px-3 py-2 text-xs">查看 Response</button>
    </div>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Webhook Dashboard" role="Super Admin">
      <SectionHeader eyebrow="Webhook Operations" title="Webhook Dashboard" text="集中查看 Webhook 最近状态、成功率、失败次数、最后响应和最后错误。" />
      <section className="grid-fit">
        <OpsMetricCard label="Webhook 日志" value={String(logs.length)} tone="brand" trend="Logs" />
        <OpsMetricCard label="成功率" value={`${successRate}%`} tone="success" trend="+1.2%" />
        <OpsMetricCard label="失败次数" value={String(failed)} tone={failed ? "danger" : "neutral"} trend={failed ? "Watch" : "0"} />
        <OpsMetricCard label="最后响应" value={String(logs[0]?.responseStatus ?? "-")} tone="cyan" trend="Latest" />
      </section>
      <section className="mt-8">
        <DataTable columns={["Webhook URL", "最近状态", "成功率", "失败次数", "最后响应", "最后错误", "操作"]} rows={rows} empty="暂无 Webhook 日志。" />
      </section>
    </DashboardShell>
  );
}
