import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { MetricCard } from "@/components/MetricCard";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Dashboard = {
  merchantCount: number;
  todayVolume: string;
  totalVolume: string;
  commissionIncome: string;
};

type Merchant = {
  name: string;
  status: string;
  wallet?: { availableBalance: string; currency: string } | null;
};

type Commission = {
  orderNo: string;
  amount: string;
  commissionRate: string;
  commissionAmount: number;
};

export default async function AgentPage() {
  const [dashboard, merchants, commissions] = await Promise.all([
    apiGet<Dashboard>("/api/agent/dashboard", { merchantCount: 0, todayVolume: "0", totalVolume: "0", commissionIncome: "0" }),
    apiGet<Merchant[]>("/api/agent/merchants", []),
    apiGet<Commission[]>("/api/agent/commissions", []),
  ]);
  const agentStats = [
    { label: "Merchant Count", value: String(dashboard.merchantCount), tone: "brand" },
    { label: "Today Volume", value: money(dashboard.todayVolume), tone: "cyan" },
    { label: "Total Volume", value: money(dashboard.totalVolume), tone: "success" },
    { label: "Commission", value: money(dashboard.commissionIncome), tone: "warn" },
  ];
  const merchantRows = merchants.map((merchant) => [
    merchant.name,
    <StatusBadge key={`${merchant.name}-status`} status={merchant.status} />,
    money(merchant.wallet?.availableBalance, merchant.wallet?.currency ?? "USD"),
    "-",
  ]);
  const commissionRows = commissions.map((commission) => [
    commission.orderNo,
    money(commission.amount),
    `${Number(commission.commissionRate) * 100}%`,
    money(commission.commissionAmount),
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Agent Center" role="Agent Admin" nav={[["Dashboard", "#dashboard"], ["My Merchants", "#merchants"], ["Order Stats", "#orders"], ["Commission", "#commissions"], ["Account", "#account"]]}>
      <section className="grid-fit">
        {agentStats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div id="merchants">
          <h2 className="mb-3 text-lg font-black text-slate-950">My Merchants</h2>
          <div className="mb-3">
            <SearchInput placeholder="Search merchants" />
          </div>
          <DataTable columns={["Merchant", "Status", "Available", "Orders"]} rows={merchantRows} />
        </div>
        <div id="commissions">
          <h2 className="mb-3 text-lg font-black text-slate-950">Commission Ledger</h2>
          <DataTable columns={["Order", "Amount", "Rate", "Commission"]} rows={commissionRows} />
        </div>
      </section>
      <section id="orders" className="mt-8 surface p-5">
        <h2 className="text-lg font-black text-slate-950">Order Statistics</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Agent order lookup and conversion reporting placeholder using the existing commission and merchant data.</p>
      </section>
      <section id="account" className="mt-8 surface p-5">
        <h2 className="text-lg font-black text-slate-950">Account Center</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Agent profile, payout setup and contact preferences can be presented here during demos.</p>
      </section>
    </DashboardShell>
  );
}
