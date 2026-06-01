import { DashboardShell } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { RiskPanel, SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Supplier = { name: string; status: string };
type Channel = { name: string; status: string };
type WebhookLog = { status: string; order?: { orderNo: string } | null; responseStatus?: number | null };
type Withdraw = { withdrawNo: string; amount: string; status: string };

export default async function AdminRiskAlertsPage() {
  const [suppliers, channels, logs, withdraws] = await Promise.all([
    apiGet<Supplier[]>("/api/admin/suppliers", []),
    apiGet<Channel[]>("/api/admin/channels", []),
    apiGet<WebhookLog[]>("/api/admin/webhook-logs", []),
    apiGet<Withdraw[]>("/api/admin/withdraws", []),
  ]);

  const risks = [
    ...suppliers.filter((item) => item.status !== "ACTIVE").map((item) => ({
      title: `${item.name} 离线`,
      text: "该 PSP 当前不可用，请进入 PSP 管理核查状态。",
      level: "CRITICAL" as const,
    })),
    ...channels.filter((item) => item.status !== "ACTIVE").map((item) => ({
      title: `${item.name} 异常`,
      text: "该通道当前不可用，请进入通道管理排查。",
      level: "WARNING" as const,
    })),
    ...logs.filter((item) => item.status === "FAILED").slice(0, 3).map((item) => ({
      title: `Webhook 失败 ${item.order?.orderNo ?? ""}`.trim(),
      text: `最近响应状态 ${item.responseStatus ?? "-"}`,
      level: "WARNING" as const,
    })),
    ...withdraws.filter((item) => Number(item.amount) >= 1000).slice(0, 3).map((item) => ({
      title: `大额提现 ${item.withdrawNo}`,
      text: "该提现金额较高，建议运营复核后再处理。",
      level: "INFO" as const,
    })),
  ];

  const rows = risks.map((risk) => [risk.title, risk.level, risk.text]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Risk Alerts" role="Super Admin">
      <SectionHeader
        eyebrow="支付运营"
        title="风险告警"
        text="集中查看 PSP 离线、通道异常、Webhook 失败和大额提现风险。"
        status={risks.length ? "WARNING" : "ACTIVE"}
      />
      <RiskPanel risks={risks} />
      <section className="mt-8">
        <SectionHeader title="告警列表" text="列表模式便于运营逐条核查和留档。" />
        <DataTable columns={["告警标题", "等级", "说明"]} rows={rows} empty="暂无风险告警。" />
      </section>
    </DashboardShell>
  );
}
