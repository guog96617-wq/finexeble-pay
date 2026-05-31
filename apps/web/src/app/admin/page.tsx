import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { MetricCard } from "@/components/MetricCard";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Dashboard = {
  todayVolume: string;
  todayOrders: number;
  successRate: number;
  activeMerchants: number;
  pendingWithdraws: number;
};

type Merchant = {
  name: string;
  status: string;
  wallet?: { availableBalance: string; currency: string } | null;
  orders?: unknown[];
};

type Order = {
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
};

type Withdraw = {
  withdrawNo: string;
  status: string;
  amount: string;
  currency: string;
};

type WebhookLog = {
  status: string;
  url: string;
  order?: { orderNo: string } | null;
};

export default async function AdminPage() {
  const [dashboard, merchants, orders, withdraws, webhookLogs] = await Promise.all([
    apiGet<Dashboard>("/api/admin/dashboard", { todayVolume: "0", todayOrders: 0, successRate: 0, activeMerchants: 0, pendingWithdraws: 0 }),
    apiGet<Merchant[]>("/api/admin/merchants", []),
    apiGet<Order[]>("/api/admin/orders", []),
    apiGet<Withdraw[]>("/api/admin/withdraws", []),
    apiGet<WebhookLog[]>("/api/admin/webhook-logs", []),
  ]);
  const stats = [
    { label: "Today Volume", value: money(dashboard.todayVolume), tone: "brand" },
    { label: "Today Orders", value: String(dashboard.todayOrders), tone: "cyan" },
    { label: "Success Rate", value: `${dashboard.successRate}%`, tone: "success" },
    { label: "Pending Withdraws", value: String(dashboard.pendingWithdraws), tone: "warn" },
  ];
  const merchantRows = merchants.map((merchant) => [
    merchant.name,
    merchant.status,
    money(merchant.wallet?.availableBalance, merchant.wallet?.currency ?? "USD"),
    `${merchant.orders?.length ?? 0} orders`,
  ]);
  const orderRows = orders.map((order) => [order.orderNo, order.merchantOrderNo, order.status, money(order.amount, order.currency)]);
  const withdrawRows = withdraws.map((withdraw) => [withdraw.withdrawNo, withdraw.status, money(withdraw.amount, withdraw.currency)]);
  const webhookRows = webhookLogs.map((log) => [log.order?.orderNo ?? "-", log.status, log.url]);

  return (
    <DashboardShell title="Super Admin Console">
      <section className="grid-fit">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section id="orders" className="mt-8 grid gap-8 xl:grid-cols-2">
        <Panel title="Merchant Management">
          <DataTable columns={["Merchant", "Status", "Balance", "Activity"]} rows={merchantRows} />
        </Panel>
        <Panel title="Order Management">
          <DataTable columns={["Order", "Merchant Order", "Status", "Amount"]} rows={orderRows} />
        </Panel>
      </section>
      <section id="wallet" className="mt-8 grid gap-8 xl:grid-cols-2">
        <Panel title="Withdraw Review">
          <DataTable columns={["Withdraw", "Status", "Amount"]} rows={withdrawRows} />
        </Panel>
        <Panel title="Webhook Logs">
          <DataTable columns={["Order", "Status", "URL"]} rows={webhookRows} />
        </Panel>
      </section>
    </DashboardShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-black">{title}</h2>
      {children}
    </div>
  );
}
