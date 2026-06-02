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

export default async function AgentWalletPage() {
  const [wallet, transactions, addresses, withdraws, settlements] = await Promise.all([
    apiGet<Wallet | null>("/api/agent/wallet", null),
    apiGet<Transaction[]>("/api/agent/wallet/transactions", []),
    apiGet<WithdrawAddress[]>("/api/agent/wallet/withdraw-addresses", []),
    apiGet<Withdraw[]>("/api/agent/withdraws", []),
    apiGet<Settlement[]>("/api/agent/wallet/settlements", []),
  ]);

  const currency = wallet?.currency ?? "USD";
  const commissionIn = transactions.filter((item) => item.type === "AGENT_COMMISSION_IN" || item.type === "SETTLEMENT_RELEASE").reduce((sum, item) => sum + Number(item.amount), 0);
  const frozenCommission = settlements.filter((item) => item.status === "FROZEN").reduce((sum, item) => sum + Number(item.amount), 0);
  const rows = transactions.map((item) => [
    item.type,
    money(item.amount, currency),
    money(item.balanceAfter, currency),
    item.description ?? "-",
    new Date(item.createdAt).toLocaleString(),
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Wallet" role="Agent Admin">
      <SectionHeader
        eyebrow="Funds & Revenue"
        title="钱包"
        text="代理钱包展示可提现余额、冻结佣金、提现地址、提现申请、提现记录和预计释放时间。"
        status="ACTIVE"
      />

      <section className="grid-fit">
        <OpsMetricCard label="佣金余额" value={money(wallet?.balance ?? 0, currency)} tone="success" trend="Balance" />
        <OpsMetricCard label="可提现余额" value={money(wallet?.availableBalance ?? 0, currency)} tone="brand" trend="Available" />
        <OpsMetricCard label="冻结佣金" value={money(wallet?.frozenBalance ?? frozenCommission, currency)} tone="warn" trend="T+N" />
        <OpsMetricCard label="已结算佣金" value={money(commissionIn, currency)} tone="cyan" trend="Released" />
      </section>

      <section className="mt-8">
        <WalletCryptoPanel wallet={wallet} owner="agent" addresses={addresses} withdraws={withdraws} settlements={settlements} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">佣金趋势</h2>
          <p className="mt-2 text-sm text-muted">T+0 佣金直接进入可提现余额，T+1/T+7 佣金先进入冻结余额。</p>
          <div className="mt-4"><SimpleBars labels={["已结算佣金", "冻结佣金", "可提现", "提现处理中", "到账"]} /></div>
        </div>
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">资金说明</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            代理提现同样只能从可提现余额扣除。冻结佣金到期释放后才会增加 available_balance。
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="代理钱包流水" text="展示佣金入账、冻结、释放和提现申请相关流水。" />
        <DataTable columns={["类型", "金额", "变动后可提现", "说明", "时间"]} rows={rows} empty="暂无代理钱包流水。" />
      </section>
    </DashboardShell>
  );
}
