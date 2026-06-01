import { AdminWithdrawActions } from "@/components/AdminWithdrawActions";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Withdraw = {
  id: string;
  withdrawNo: string;
  status: string;
  amount: string;
  currency: string;
  merchant?: { name: string } | null;
};

export default async function AdminWithdrawsPage() {
  const withdraws = await apiGet<Withdraw[]>("/api/admin/withdraws", []);
  const pending = withdraws.filter((withdraw) => withdraw.status === "PENDING");
  const approved = withdraws.filter((withdraw) => withdraw.status === "APPROVED");
  const paid = withdraws.filter((withdraw) => withdraw.status === "PAID");
  const pendingAmount = pending.reduce((sum, withdraw) => sum + Number(withdraw.amount), 0);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="提现审核" role="Super Admin">
      <SectionHeader
        eyebrow="资金与结算"
        title="提现审核"
        text="提现审核页只处理提现申请的查看、批准、拒绝和标记已支付。提现规则配置请进入提现规则页。"
        status={pending.length ? "PENDING" : "ACTIVE"}
      />
      <section className="grid-fit">
        <OpsMetricCard label="待审核提现" value={String(pending.length)} tone="warn" trend="Review" />
        <OpsMetricCard label="待支付提现" value={String(approved.length)} tone="cyan" trend="Payout" />
        <OpsMetricCard label="已支付提现" value={String(paid.length)} tone="success" trend="Paid" />
        <OpsMetricCard label="待审核金额" value={money(pendingAmount)} tone="brand" trend="Amount" />
      </section>
      <section className="mt-8">
        <ListToolbar searchPlaceholder="搜索提现单、商户或金额" statusLabel="全部提现状态" />
        <AdminWithdrawActions withdraws={withdraws} />
      </section>
    </DashboardShell>
  );
}
