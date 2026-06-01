import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ApiKeyPanel } from "@/components/ApiKeyPanel";
import { MerchantForms } from "@/components/MerchantForms";
import { MetricCard } from "@/components/MetricCard";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { WebhookEditor } from "@/components/WebhookEditor";
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
  id: string;
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
  paymentUrl?: string | null;
  attempts?: { attemptNo: number; status: string; channel?: { name: string } | null }[];
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

type ApiKey = {
  apiKey: string;
  status: string;
  createdAt: string;
};

type Webhook = {
  id: string;
  url: string;
  secret: string;
  status: string;
};

export default async function MerchantPage() {
  const [dashboard, orders, wallet, withdraws, apiKeys, webhooks] = await Promise.all([
    apiGet<Dashboard>("/api/merchant/dashboard", { todayReceipts: "0", yesterdayReceipts: "0", totalOrders: 0, successRate: 0, availableBalance: "0" }),
    apiGet<Order[]>("/api/merchant/orders", []),
    apiGet<Wallet | null>("/api/merchant/wallet", null),
    apiGet<Withdraw[]>("/api/merchant/withdraws", []),
    apiGet<ApiKey[]>("/api/merchant/api-keys", []),
    apiGet<Webhook[]>("/api/merchant/webhooks", []),
  ]);
  const merchantStats = [
    { label: "Today Receipts", value: money(dashboard.todayReceipts), tone: "success", caption: "Coinbase style" },
    { label: "Yesterday Receipts", value: money(dashboard.yesterdayReceipts), tone: "cyan" },
    { label: "Total Orders", value: String(dashboard.totalOrders), tone: "brand" },
    { label: "Success Rate", value: `${dashboard.successRate}%`, tone: "success", caption: "Live" },
    { label: "Available Balance", value: money(dashboard.availableBalance, wallet?.currency ?? "USD"), tone: "warn" },
  ];
  const orderRows = orders.map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.paymentUrl ? <a key={`${order.orderNo}-checkout`} className="font-bold text-brand" href={order.paymentUrl}>Open Checkout</a> : "-",
    order.attempts?.map((attempt) => `${attempt.attemptNo}.${attempt.status}${attempt.channel?.name ? ` ${attempt.channel.name}` : ""}`).join(" / ") ?? "-",
  ]);
  const withdrawRows = withdraws.map((withdraw) => [withdraw.withdrawNo, <StatusBadge key={`${withdraw.withdrawNo}-status`} status={withdraw.status} />, money(withdraw.amount, withdraw.currency)]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Merchant Center" role="Merchant Admin">
      <section className="grid-fit">
        {merchantStats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section id="orders" className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
        <div>
          <h2 className="mb-3 text-lg font-black text-slate-950">Orders</h2>
          <div className="mb-3">
            <SearchInput placeholder="Search orders" />
          </div>
          <DataTable columns={["Order", "Merchant Order", "Status", "Amount", "Checkout", "Payment Attempts"]} rows={orderRows} />
        </div>
        <div className="grid gap-4">
          <div id="order-form">
            <MerchantForms />
          </div>
          <div id="wallet" className="surface p-5">
            <h2 className="text-lg font-black text-slate-950">Wallet</h2>
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              <p>Balance: {money(wallet?.balance, wallet?.currency ?? "USD")}</p>
              <p>Available: {money(wallet?.availableBalance, wallet?.currency ?? "USD")}</p>
              <p>Frozen: {money(wallet?.frozenBalance, wallet?.currency ?? "USD")}</p>
            </div>
          </div>
        </div>
      </section>
      <section id="withdraws" className="mt-8 grid gap-8 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-black text-slate-950">Withdraws</h2>
          <DataTable columns={["Withdraw", "Status", "Amount"]} rows={withdrawRows} />
        </div>
        <div id="webhook">
          <WebhookEditor webhooks={webhooks} />
        </div>
      </section>
      <section id="api" className="mt-8">
        <ApiKeyPanel apiKeys={apiKeys} />
      </section>
      <section id="sdk" className="mt-8 grid gap-8 xl:grid-cols-2">
        <Showcase title="SDK Center" items={["PHP SDK", "Node.js SDK", "Java SDK", "Python SDK"]} />
        <Showcase title="Plugin Center" id="plugins" items={["Shopify", "WooCommerce", "Shopline", "Magento", "OpenCart"]} />
      </section>
      <section id="account" className="mt-8 surface p-5">
        <h2 className="text-lg font-black text-slate-950">Account Center</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Demo merchant profile, settlement currency and security settings placeholders for sales walkthroughs.</p>
      </section>
    </DashboardShell>
  );
}

function Showcase({ title, items, id }: { title: string; items: string[]; id?: string }) {
  return (
    <div id={id}>
      <h2 className="mb-3 text-lg font-black text-slate-950">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={item} className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black text-slate-900">{item}</h3>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${index < 3 ? "bg-green-50 text-success" : "bg-amber-50 text-warn"}`}>
                {index < 3 ? "Available" : "Coming Soon"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">Integration guide, credentials checklist and webhook setup notes.</p>
            <button type="button" className="button secondary mt-4 w-full">View guide</button>
          </div>
        ))}
      </div>
    </div>
  );
}
