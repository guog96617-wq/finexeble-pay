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
  settlementType?: string;
  settlementDays?: number;
  releaseAt?: string | null;
  createdAt?: string;
};

export default async function AgentCommissionsPage() {
  const commissions = await apiGet<Commission[]>("/api/agent/commissions", []);
  const totalCommission = commissions.reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const totalAmount = commissions.reduce((sum, item) => sum + Number(item.amount), 0);
  const frozenCommission = commissions.filter((item) => Number(item.settlementDays ?? 0) > 0).reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const settledCommission = totalCommission - frozenCommission;

  const rows = commissions.map((item) => [
    item.orderNo,
    money(item.amount),
    item.commissionRate ? `${(Number(item.commissionRate) * 100).toFixed(2)}%` : "-",
    money(item.commissionAmount),
    item.settlementType ?? `T+${item.settlementDays ?? 0}`,
    Number(item.settlementDays ?? 0) > 0 ? "冻结中" : "已结算",
    item.releaseAt ? new Date(item.releaseAt).toLocaleString() : "-",
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Commission" role="Agent Admin">
      <SectionHeader
        eyebrow="Funds & Revenue"
        title="我的佣金"
        text="佣金会按通道 T+N 规则进入可提现余额或冻结余额。"
        status="ACTIVE"
      />
      <section className="mb-6 grid-fit">
        <OpsMetricCard label="累计佣金" value={money(totalCommission)} tone="success" trend="Revenue" />
        <OpsMetricCard label="已结算佣金" value={money(settledCommission)} tone="brand" trend="Available" />
        <OpsMetricCard label="冻结佣金" value={money(frozenCommission)} tone="warn" trend="Frozen" />
        <OpsMetricCard label="累计交易额" value={money(totalAmount)} tone="brand" trend="Volume" />
        <OpsMetricCard label="佣金记录数" value={String(commissions.length)} tone="cyan" trend="Count" />
      </section>
      <DataTable
        columns={["订单号", "订单金额", "佣金费率", "佣金金额", "结算类型", "状态", "预计释放时间", "时间"]}
        rows={rows}
        empty="暂无佣金记录。"
      />
    </DashboardShell>
  );
}
