import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Wallet = {
  balance: string;
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

function displayStatus(status: string) {
  if (status === "APPROVED") return "REVIEWING";
  return status;
}

export default async function MerchantWithdrawsPage() {
  const [wallet, withdraws] = await Promise.all([
    apiGet<Wallet | null>("/api/merchant/wallet", null),
    apiGet<Withdraw[]>("/api/merchant/withdraws", []),
  ]);

  const currency = wallet?.currency ?? "USD";
  const today = new Date().toDateString();
  const todayWithdrawAmount = withdraws
    .filter((item) => item.createdAt && new Date(item.createdAt).toDateString() === today)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const processingAmount = withdraws
    .filter((item) => item.status === "PENDING" || item.status === "APPROVED")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const paidToday = withdraws
    .filter((item) => item.status === "PAID" && item.createdAt && new Date(item.createdAt).toDateString() === today)
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const rows = withdraws.map((item) => [
    item.withdrawNo,
    money(item.amount, item.currency),
    item.asset ?? "-",
    item.network ?? "-",
    item.addressSnapshot ? `****${item.addressSnapshot.slice(-4)}` : "-",
    <StatusBadge key={item.withdrawNo} status={displayStatus(item.status)} />,
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Withdraw Center" role="Merchant Admin">
      <SectionHeader
        eyebrow="Funds Center"
        title="提现记录"
        text="V1.8 提现申请入口只放在钱包页面。本页保留为提现记录查看。"
        status="ACTIVE"
        action={<a href="/merchant/wallet" className="button">前往钱包页申请提现</a>}
      />

      <section className="grid-fit">
        <OpsMetricCard label="可提现余额" value={money(wallet?.availableBalance ?? 0, currency)} tone="success" trend="Available" />
        <OpsMetricCard label="冻结金额" value={money(wallet?.frozenBalance ?? 0, currency)} tone="warn" trend="Frozen" />
        <OpsMetricCard label="今日提现" value={money(todayWithdrawAmount, currency)} tone="brand" trend="Today" />
        <OpsMetricCard label="提现处理中" value={money(processingAmount, currency)} tone="cyan" trend="Processing" />
        <OpsMetricCard label="今日到账金额" value={money(paidToday, currency)} tone="success" trend="Paid" />
      </section>

      <section className="mt-8">
        <SectionHeader title="提现记录" text="状态包含 PENDING / APPROVED / REJECTED / PAID。" />
        <DataTable
          columns={["提现单号", "金额", "币种", "网络", "地址尾号", "状态", "创建时间"]}
          rows={rows}
          empty="暂无提现记录。"
        />
      </section>
    </DashboardShell>
  );
}
