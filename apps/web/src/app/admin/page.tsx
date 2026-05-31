import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { MetricCard } from "@/components/MetricCard";
import { AdminWithdrawActions } from "@/components/AdminWithdrawActions";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
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
  id: string;
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
  attempts?: { attemptNo: number; status: string; errorMessage?: string | null; channel?: { name: string } | null }[];
};

type Withdraw = {
  id: string;
  withdrawNo: string;
  status: string;
  amount: string;
  currency: string;
  merchant?: { name: string } | null;
};

type WebhookLog = {
  status: string;
  url: string;
  requestPayload?: { event?: string; orderNo?: string; status?: string } | null;
  responseStatus?: number | null;
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
    <StatusBadge key={`${merchant.name}-status`} status={merchant.status} />,
    money(merchant.wallet?.availableBalance, merchant.wallet?.currency ?? "USD"),
    `${merchant.orders?.length ?? 0} orders`,
  ]);
  const orderRows = orders.map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.attempts?.map((attempt) => `${attempt.attemptNo}.${attempt.status}${attempt.channel?.name ? ` ${attempt.channel.name}` : ""}`).join(" / ") ?? "-",
  ]);
  const webhookRows = webhookLogs.map((log) => [
    log.order?.orderNo ?? log.requestPayload?.orderNo ?? "-",
    log.requestPayload?.event ?? "-",
    log.status,
    String(log.responseStatus ?? "-"),
    log.url,
  ]);

  return (
    <DashboardShell title="Super Admin Console" role="Super Admin" nav={[["Dashboard", "#dashboard"], ["Merchants", "#merchants"], ["Agents", "#agents"], ["PSP", "#psp"], ["Orders", "#orders"], ["Finance", "#withdraws"], ["Routing", "#routing"], ["Plugins", "#plugins"], ["Security", "#security"], ["Settings", "#settings"]]}>
      <section className="grid-fit">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section id="orders" className="mt-8 grid gap-8 xl:grid-cols-2">
        <Panel title="Merchant Management" id="merchants">
          <div className="mb-3">
            <SearchInput placeholder="Search merchants" />
          </div>
          <DataTable columns={["Merchant", "Status", "Balance", "Activity"]} rows={merchantRows} />
        </Panel>
        <Panel title="Order Management">
          <div className="mb-3">
            <SearchInput placeholder="Search orders" />
          </div>
          <DataTable columns={["Order", "Merchant Order", "Status", "Amount", "Payment Attempts"]} rows={orderRows} />
        </Panel>
      </section>
      <section id="withdraws" className="mt-8 grid gap-8 xl:grid-cols-2">
        <Panel title="Withdraw Review">
          <AdminWithdrawActions withdraws={withdraws} />
        </Panel>
        <Panel title="Webhook Logs" id="webhooks">
          <DataTable columns={["Order", "Event", "Status", "Response", "URL"]} rows={webhookRows} />
        </Panel>
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-3">
        <Panel title="PSP Management" id="psp">
          <MiniCard title="Primary PSP" text="Mock provider, active, 1.8% fee, primary channel." tone="success" />
          <MiniCard title="Backup PSP" text="Mock backup, active, failover channel." tone="info" />
        </Panel>
        <Panel title="Routing Center" id="routing">
          <MiniCard title="Failover policy" text="Primary channel first, backup channel on provider failure." tone="info" />
          <MiniCard title="Payment attempts" text="Attempts are shown in order detail rows." tone="success" />
        </Panel>
        <Panel title="Security Center" id="security">
          <MiniCard title="HMAC API" text="Timestamp, nonce and signature headers are required for merchant APIs." tone="info" />
          <MiniCard title="Audit friendly" text="Webhook logs and withdrawal actions remain visible for review." tone="success" />
        </Panel>
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-3">
        <Panel title="Agent Management" id="agents">
          <MiniCard title="Agent network" text="Review agent-owned merchants, total volume and commission health." tone="info" />
        </Panel>
        <Panel title="Plugin Center" id="plugins">
          <MiniCard title="Commerce plugins" text="Shopify, WooCommerce and Shopline integration packages are staged for onboarding." tone="success" />
        </Panel>
        <Panel title="System Settings" id="settings">
          <MiniCard title="Demo environment" text="Core payment, wallet, withdrawal and webhook flows remain unchanged." tone="info" />
        </Panel>
      </section>
    </DashboardShell>
  );
}

function Panel({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id}>
      <h2 className="mb-3 text-lg font-black text-slate-950">{title}</h2>
      {children}
    </div>
  );
}

function MiniCard({ title, text, tone }: { title: string; text: string; tone: "success" | "info" }) {
  return (
    <div className="mb-3 rounded-xl border border-line bg-white p-4 shadow-sm last:mb-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-slate-900">{title}</h3>
        <span className={`h-2.5 w-2.5 rounded-full ${tone === "success" ? "bg-success" : "bg-brand"}`} />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
