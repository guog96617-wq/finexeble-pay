import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Wallet = { balance: string; availableBalance: string; frozenBalance: string; currency: string };
type Transaction = { id: string; type: string; amount: string; balanceAfter: string; description?: string | null; createdAt: string };
type Withdraw = { withdrawNo: string; status: string; amount: string; feeAmount?: string; actualPayout?: string; currency: string; createdAt?: string };

export default async function MerchantWalletPage() {
  const [wallet, transactions, withdraws] = await Promise.all([
    apiGet<Wallet | null>("/api/merchant/wallet", null),
    apiGet<Transaction[]>("/api/merchant/wallet/transactions", []),
    apiGet<Withdraw[]>("/api/merchant/withdraws", []),
  ]);
  const currency = wallet?.currency ?? "USD";
  const income = transactions.filter((item) => item.type.includes("PAYMENT")).reduce((sum, item) => sum + Number(item.amount), 0);
  const frozen = Number(wallet?.frozenBalance ?? 0);
  const rows = transactions.map((item) => [
    item.type,
    money(item.amount, currency),
    money(item.balanceAfter, currency),
    item.description ?? "-",
    new Date(item.createdAt).toLocaleString(),
  ]);
  const withdrawRows = withdraws.map((item) => [
    item.withdrawNo,
    <StatusBadge key={item.withdrawNo} status={item.status} />,
    money(item.amount, item.currency),
    money(item.feeAmount ?? 0, item.currency),
    money(item.actualPayout ?? Number(item.amount) - Number(item.feeAmount ?? 0), item.currency),
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="钱包余额" role="Merchant Admin">
      <SectionHeader eyebrow="Wallet" title="钱包与资金流水" text="像 Stripe Balance / Coinbase Wallet 一样，展示余额、冻结、提现历史和流水分类。" />
      <section className="grid-fit">
        <OpsMetricCard label="总余额" value={money(wallet?.balance, currency)} tone="brand" trend="Balance" />
        <OpsMetricCard label="可提现余额" value={money(wallet?.availableBalance, currency)} tone="success" trend="Available" />
        <OpsMetricCard label="冻结余额" value={money(frozen, currency)} tone="warn" trend="Frozen" />
        <OpsMetricCard label="累计收入" value={money(income, currency)} tone="cyan" trend="+8.7%" />
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">收入图表</h2>
          <p className="mt-2 text-sm text-muted">7天 / 30天收入趋势。</p>
          <div className="mt-4"><SimpleBars labels={["7天收入", "30天收入", "提现", "手续费", "冻结"]} /></div>
        </div>
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">流水类型筛选</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["PAYMENT_IN", "WITHDRAW", "FEE", "REFUND", "FREEZE", "UNFREEZE"].map((item) => (
              <span key={item} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-bold text-slate-600">{item}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-8">
        <SectionHeader title="钱包变化趋势" text="流水按时间倒序显示，帮助商户理解每一次余额变化。" />
        <DataTable columns={["类型", "金额", "变动后余额", "说明", "时间"]} rows={rows} empty="暂无钱包流水。" />
      </section>
      <section className="mt-8">
        <SectionHeader title="提现历史" text="展示提现状态、手续费和实际到账金额。" />
        <DataTable columns={["提现单", "状态", "提现金额", "手续费", "实际到账"]} rows={withdrawRows} empty="暂无提现历史。" />
      </section>
    </DashboardShell>
  );
}
