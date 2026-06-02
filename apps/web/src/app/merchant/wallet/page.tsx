import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { WalletCryptoPanel } from "@/components/WalletCryptoPanel";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Wallet = {
  balance: string;
  availableBalance: string;
  frozenBalance: string;
  rollingReserveBalance: string;
  currency: string;
};

type Transaction = { id: string; type: string; amount: string; balanceAfter: string; description?: string | null; createdAt: string };
type WithdrawAddress = { id: string; label: string; asset: "USDT" | "USDC"; network: "ERC20" | "TRC20" | "BEP20"; address: string; status: string; createdAt: string };
type Withdraw = { id: string; withdrawNo: string; amount: string; currency: string; asset?: string | null; network?: string | null; addressSnapshot?: string | null; addressLabelSnapshot?: string | null; status: string; createdAt: string };
type Settlement = { id: string; amount: string; status: string; settlementDays: number; releaseAt: string; releasedAt?: string | null; order?: { orderNo?: string | null } | null };

export default async function MerchantWalletPage() {
  const [wallet, transactions, addresses, withdraws, settlements] = await Promise.all([
    apiGet<Wallet | null>("/api/merchant/wallet", null),
    apiGet<Transaction[]>("/api/merchant/wallet/transactions", []),
    apiGet<WithdrawAddress[]>("/api/merchant/wallet/withdraw-addresses", []),
    apiGet<Withdraw[]>("/api/merchant/withdraws", []),
    apiGet<Settlement[]>("/api/merchant/wallet/settlements", []),
  ]);

  const currency = wallet?.currency ?? "USD";
  const paymentIn = transactions.filter((item) => item.type === "PAYMENT_IN").reduce((sum, item) => sum + Number(item.amount), 0);
  const feeOut = transactions.filter((item) => item.type === "MERCHANT_FEE_OUT" || item.type === "FEE_OUT").reduce((sum, item) => sum + Number(item.amount), 0);
  const reserveHold = transactions.filter((item) => item.type === "ROLLING_RESERVE_HOLD").reduce((sum, item) => sum + Number(item.amount), 0);

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
        eyebrow="Funds center"
        title="Wallet center"
        text="提现地址、提现申请、提现记录和冻结资金明细都集中在钱包页。提现只能使用 available balance。"
        status="ACTIVE"
      />

      <section className="grid-fit">
        <OpsMetricCard label="Total balance" value={money(wallet?.balance, currency)} tone="brand" trend="Total" />
        <OpsMetricCard label="Available balance" value={money(wallet?.availableBalance, currency)} tone="success" trend="Withdrawable" />
        <OpsMetricCard label="Frozen balance" value={money(wallet?.frozenBalance, currency)} tone="warn" trend="T+N" />
        <OpsMetricCard label="Rolling reserve" value={money(wallet?.rollingReserveBalance, currency)} tone="cyan" trend="Held" />
        <OpsMetricCard label="Payment in" value={money(paymentIn, currency)} tone="brand" trend="Ledger" />
        <OpsMetricCard label="Merchant fees" value={money(feeOut, currency)} tone="warn" trend="Fee out" />
        <OpsMetricCard label="Reserve holds" value={money(reserveHold, currency)} tone="cyan" trend="Reserve" />
      </section>

      <section className="mt-8">
        <WalletCryptoPanel wallet={wallet} owner="merchant" addresses={addresses} withdraws={withdraws} settlements={settlements} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">Funds overview</h2>
          <p className="mt-2 text-sm text-muted">Available, frozen and rolling reserve balances are tracked independently.</p>
          <div className="mt-4">
            <SimpleBars labels={["Available", "Frozen", "Rolling reserve", "Payment in", "Fee out"]} />
          </div>
        </div>
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">Ledger types</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["PAYMENT_IN", "MERCHANT_FEE_OUT", "ROLLING_RESERVE_HOLD", "WITHDRAW_FREEZE", "WITHDRAW_PAID", "ADJUSTMENT"].map((item) => (
              <span key={item} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-bold text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="Wallet ledger" text="Ledger is sorted by time and shows payment income, merchant fee deduction and rolling reserve hold records." />
        <DataTable columns={["Type", "Amount", "Balance after", "Description", "Time"]} rows={rows} empty="No wallet transactions." />
      </section>
    </DashboardShell>
  );
}
