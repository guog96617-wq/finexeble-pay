import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Wallet = {
  availableBalance: string;
  frozenBalance: string;
  currency: string;
};

type Withdraw = {
  withdrawNo: string;
  amount: string;
  currency: string;
  asset?: string | null;
  network?: string | null;
  addressSnapshot?: string | null;
  status: string;
  createdAt?: string;
};

export default async function AgentWithdrawsPage() {
  const [wallet, withdraws] = await Promise.all([
    apiGet<Wallet | null>("/api/agent/wallet", null),
    apiGet<Withdraw[]>("/api/agent/withdraws", []),
  ]);
  const currency = wallet?.currency ?? "USD";
  const pendingAmount = withdraws
    .filter((item) => item.status === "PENDING" || item.status === "APPROVED")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const rows = withdraws.map((item) => [
    item.withdrawNo,
    money(item.amount, item.currency),
    item.asset ?? "-",
    item.network ?? "-",
    item.addressSnapshot ? `****${item.addressSnapshot.slice(-4)}` : "-",
    <StatusBadge key={item.withdrawNo} status={item.status} />,
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Withdraw Records" role="Agent Admin">
      <SectionHeader
        eyebrow="Funds & Revenue"
        title="提现记录"
        text="V1.8 代理提现申请入口只放在钱包页面。本页保留为提现记录查看。"
        status="ACTIVE"
        action={<a href="/agent/wallet" className="button">前往钱包页申请提现</a>}
      />
      <section className="grid-fit">
        <OpsMetricCard label="可提现余额" value={money(wallet?.availableBalance ?? 0, currency)} tone="success" trend="Available" />
        <OpsMetricCard label="冻结佣金" value={money(wallet?.frozenBalance ?? 0, currency)} tone="warn" trend="Frozen" />
        <OpsMetricCard label="提现处理中" value={money(pendingAmount, currency)} tone="cyan" trend="Pending" />
      </section>
      <section className="mt-8">
        <DataTable columns={["提现单号", "金额", "币种", "网络", "地址尾号", "状态", "创建时间"]} rows={rows} empty="暂无提现记录。" />
      </section>
    </DashboardShell>
  );
}
