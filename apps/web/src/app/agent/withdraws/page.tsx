import { AgentWithdrawCenter } from "@/components/AgentWithdrawCenter";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Commission = {
  commissionAmount: number;
  createdAt?: string;
};

export default async function AgentWithdrawsPage() {
  const commissions = await apiGet<Commission[]>("/api/agent/commissions", []);
  const available = commissions.reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const today = new Date().toDateString();
  const todayCommission = commissions
    .filter((item) => item.createdAt && new Date(item.createdAt).toDateString() === today)
    .reduce((sum, item) => sum + Number(item.commissionAmount), 0);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Withdraw Management" role="Agent Admin">
      <SectionHeader
        eyebrow="Funds & Revenue"
        title="提现管理"
        text="管理代理提现申请与提现状态。"
        status="ACTIVE"
      />
      <AgentWithdrawCenter availableBalance={available} frozenBalance={0} todayCommission={todayCommission} />
    </DashboardShell>
  );
}
