import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { MetricCard } from "@/components/MetricCard";
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
    merchant.status,
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
    <DashboardShell title="Agent Center">
      <section className="grid-fit">
        {agentStats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-black">My Merchants</h2>
          <DataTable columns={["Merchant", "Status", "Available", "Orders"]} rows={merchantRows} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-black">Commission Ledger</h2>
          <DataTable columns={["Order", "Amount", "Rate", "Commission"]} rows={commissionRows} />
        </div>
      </section>
    </DashboardShell>
  );
}
