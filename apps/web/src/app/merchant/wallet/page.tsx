import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Wallet = { balance: string; availableBalance: string; frozenBalance: string; currency: string };
type Transaction = { id: string; type: string; amount: string; balanceAfter: string; description?: string | null; createdAt: string };

export default async function MerchantWalletPage() {
  const [wallet, transactions] = await Promise.all([
    apiGet<Wallet | null>("/api/merchant/wallet", null),
    apiGet<Transaction[]>("/api/merchant/wallet/transactions", []),
  ]);

  const currency = wallet?.currency ?? "USD";
  const paymentIn = transactions.filter((item) => item.type.includes("PAYMENT")).reduce((sum, item) => sum + Number(item.amount), 0);
  const feeOut = transactions.filter((item) => item.type.includes("FEE")).reduce((sum, item) => sum + Number(item.amount), 0);

  const rows = transactions.map((item) => [
    item.type,
    money(item.amount, currency),
    money(item.balanceAfter, currency),
    item.description ?? "-",
    new Date(item.createdAt).toLocaleString(),
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Wallet Center" role="Merchant Admin">
      <SectionHeader
        eyebrow="Funds Center"
        title="钱包中心"
        text="钱包页面只负责余额、流水、趋势和统计。提现申请已独立到“资金中心 / 提现”。"
        status="ACTIVE"
        action={<a href="/merchant/withdraws" className="button">前往提现中心</a>}
      />

      <section className="grid-fit">
        <OpsMetricCard label="总余额" value={money(wallet?.balance, currency)} tone="brand" trend="Balance" />
        <OpsMetricCard label="可提现余额" value={money(wallet?.availableBalance, currency)} tone="success" trend="Available" />
        <OpsMetricCard label="冻结金额" value={money(wallet?.frozenBalance, currency)} tone="warn" trend="Frozen" />
        <OpsMetricCard label="累计入账" value={money(paymentIn, currency)} tone="cyan" trend="Inflow" />
        <OpsMetricCard label="累计手续费" value={money(feeOut, currency)} tone="brand" trend="Fee Out" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">资金趋势</h2>
          <p className="mt-2 text-sm text-muted">用于观察最近周期资金变化。</p>
          <div className="mt-4">
            <SimpleBars labels={["可提现余额", "冻结金额", "支付入账", "手续费", "净变化"]} />
          </div>
        </div>
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">流水分类</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["PAYMENT_IN", "WITHDRAW_FREEZE", "WITHDRAW_SUCCESS", "WITHDRAW_FAILED", "FEE_OUT", "REFUND_OUT"].map((item) => (
              <span key={item} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-bold text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="钱包流水" text="按时间倒序展示每笔余额变化，帮助快速核对资金。 " />
        <DataTable columns={["类型", "金额", "变动后余额", "说明", "时间"]} rows={rows} empty="暂无钱包流水。" />
      </section>
    </DashboardShell>
  );
}
