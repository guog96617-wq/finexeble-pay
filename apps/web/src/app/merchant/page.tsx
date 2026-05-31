import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { MerchantActions } from "@/components/MerchantActions";
import { MetricCard } from "@/components/MetricCard";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Dashboard = {
  todayReceipts: string;
  yesterdayReceipts: string;
  totalOrders: number;
  successRate: number;
  availableBalance: string;
};

type Order = {
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
};

type Wallet = {
  balance: string;
  availableBalance: string;
  frozenBalance: string;
  currency: string;
};

type Withdraw = {
  withdrawNo: string;
  status: string;
  amount: string;
  currency: string;
};

export default async function MerchantPage() {
  const [dashboard, orders, wallet, withdraws] = await Promise.all([
    apiGet<Dashboard>("/api/merchant/dashboard", { todayReceipts: "0", yesterdayReceipts: "0", totalOrders: 0, successRate: 0, availableBalance: "0" }),
    apiGet<Order[]>("/api/merchant/orders", []),
    apiGet<Wallet | null>("/api/merchant/wallet", null),
    apiGet<Withdraw[]>("/api/merchant/withdraws", []),
  ]);
  const merchantStats = [
    { label: "Today Receipts", value: money(dashboard.todayReceipts), tone: "success" },
    { label: "Yesterday Receipts", value: money(dashboard.yesterdayReceipts), tone: "cyan" },
    { label: "Total Orders", value: String(dashboard.totalOrders), tone: "brand" },
    { label: "Available Balance", value: money(dashboard.availableBalance, wallet?.currency ?? "USD"), tone: "warn" },
  ];
  const orderRows = orders.map((order) => [order.orderNo, order.merchantOrderNo, order.status, money(order.amount, order.currency)]);
  const withdrawRows = withdraws.map((withdraw) => [withdraw.withdrawNo, withdraw.status, money(withdraw.amount, withdraw.currency)]);

  return (
    <DashboardShell title="Merchant Center">
      <section className="grid-fit">
        {merchantStats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
        <div>
          <h2 className="mb-3 text-lg font-black">Orders</h2>
          <DataTable columns={["Order", "Merchant Order", "Status", "Amount"]} rows={orderRows} />
        </div>
        <div className="grid gap-4">
          <MerchantActions />
          <div className="surface p-5">
            <h2 className="text-lg font-black">Wallet</h2>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <p>Balance: {money(wallet?.balance, wallet?.currency ?? "USD")}</p>
              <p>Available: {money(wallet?.availableBalance, wallet?.currency ?? "USD")}</p>
              <p>Frozen: {money(wallet?.frozenBalance, wallet?.currency ?? "USD")}</p>
            </div>
          </div>
        </div>
      </section>
      <section id="api" className="mt-8 grid-fit">
        <div>
          <h2 className="mb-3 text-lg font-black">Withdraws</h2>
          <DataTable columns={["Withdraw", "Status", "Amount"]} rows={withdrawRows} />
        </div>
      </section>
    </DashboardShell>
  );
}
