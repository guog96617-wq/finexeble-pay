import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Commission = {
  orderNo: string;
  amount: string;
  commissionRate: string;
  commissionAmount: number;
  createdAt?: string;
};

export default async function AgentCommissionsPage() {
  const commissions = await apiGet<Commission[]>("/api/agent/commissions", []);
  const totalCommission = commissions.reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const totalAmount = commissions.reduce((sum, item) => sum + Number(item.amount), 0);

  const rows = commissions.map((item) => [
    item.orderNo,
    money(item.amount),
    `${(Number(item.commissionRate) * 100).toFixed(2)}%`,
    money(item.commissionAmount),
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Commission" role="Agent Admin">
      <SectionHeader
        eyebrow="Funds & Revenue"
        title="我的佣金"
        text="该页面只负责佣金统计与佣金明细。"
        status="ACTIVE"
      />
      <section className="mb-6 grid-fit">
        <OpsMetricCard label="累计佣金" value={money(totalCommission)} tone="success" trend="Revenue" />
        <OpsMetricCard label="累计交易额" value={money(totalAmount)} tone="brand" trend="Volume" />
        <OpsMetricCard label="佣金记录数" value={String(commissions.length)} tone="cyan" trend="Count" />
      </section>
      <DataTable
        columns={["订单号", "订单金额", "佣金费率", "佣金金额", "时间"]}
        rows={rows}
        empty="暂无佣金记录。"
      />
    </DashboardShell>
  );
}
