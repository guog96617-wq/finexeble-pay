import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { MetricCard } from "@/components/MetricCard";
import { AdminWithdrawActions } from "@/components/AdminWithdrawActions";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import { Banknote, Boxes, Cable, CircleDollarSign, ClipboardList, CreditCard, Landmark, Network, Route, Store, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Dashboard = {
  todayVolume: string;
  todayOrders: number;
  successRate: number;
  activeMerchants: number;
  pendingWithdraws: number;
};

type Merchant = {
  id: string;
  name: string;
  email?: string;
  status: string;
  wallet?: { availableBalance: string; currency: string } | null;
  orders?: unknown[];
};

type Agent = {
  id: string;
  name: string;
  email?: string;
  status: string;
  merchants?: Merchant[];
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
  const [dashboard, merchants, agents, orders, withdraws, webhookLogs] = await Promise.all([
    apiGet<Dashboard>("/api/admin/dashboard", { todayVolume: "0", todayOrders: 0, successRate: 0, activeMerchants: 0, pendingWithdraws: 0 }),
    apiGet<Merchant[]>("/api/admin/merchants", []),
    apiGet<Agent[]>("/api/admin/agents", []),
    apiGet<Order[]>("/api/admin/orders", []),
    apiGet<Withdraw[]>("/api/admin/withdraws", []),
    apiGet<WebhookLog[]>("/api/admin/webhook-logs", []),
  ]);
  const quickActions = [
    { title: "新增 PSP", href: "/admin/psp#create-psp", icon: Landmark, text: "添加新的支付供应商，例如 Stripe、Airwallex、Sandbox PSP。" },
    { title: "新增支付通道", href: "/admin/channels#create-channel", icon: Route, text: "在 PSP 下新增银行卡、本地支付或 Sandbox 收银通道。" },
    { title: "管理 PSP", href: "/admin/psp", icon: Network, text: "查看 PSP 状态、API 地址和通道数量。" },
    { title: "管理通道", href: "/admin/channels", icon: Cable, text: "配置通道启用状态、主通道和备用通道。" },
    { title: "设置代理费率", href: "/admin/agents#fee-rules", icon: CircleDollarSign, text: "设置代理最低费率，代理给商户的费率不能低于该值。" },
    { title: "设置商户费率", href: "/admin/merchants#merchant-fees", icon: CreditCard, text: "为商户配置可用通道、手续费和主备路由。" },
    { title: "设置提现规则", href: "/admin/withdraw-rules", icon: Banknote, text: "配置最低/最高提现金额、手续费和审核规则。" },
    { title: "管理代理商", href: "/admin/agents", icon: Users, text: "查看代理、名下商户和费率权限入口。" },
    { title: "管理商户", href: "/admin/merchants", icon: Store, text: "查看商户、钱包、订单和 PSP 配置入口。" },
    { title: "查看 Checkout 订单", href: "/admin/checkout-orders", icon: ClipboardList, text: "查看带 Checkout 链接和支付尝试的订单。" },
  ];
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
    <div key={`${merchant.id}-actions`} className="flex flex-wrap gap-2">
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}/psp`}>设置 PSP / 费率</Link>
      <Link className="button secondary px-3 py-2 text-xs" href="/admin#orders">查看订单</Link>
    </div>,
  ]);
  const agentRows = agents.map((agent) => [
    agent.name,
    <StatusBadge key={`${agent.name}-status`} status={agent.status} />,
    `${agent.merchants?.length ?? 0} 个商户`,
    <div key={`${agent.id}-actions`} className="flex flex-wrap gap-2">
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/agents/${agent.id}/fee-rules`}>设置费率权限</Link>
      <Link className="button secondary px-3 py-2 text-xs" href="/admin/merchants">查看名下商户</Link>
    </div>,
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
    <DashboardShell requiredRole="SUPER_ADMIN" title="运营管理后台" role="Super Admin">
      <section className="grid-fit">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-brand">Operations shortcuts</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">运营快捷操作</h2>
            <p className="mt-2 text-sm text-muted">常用配置入口集中在这里，新同事也能按业务动作找到按钮。</p>
          </div>
          <Link href="/admin/psp#create-psp" className="button">
            <Boxes className="h-4 w-4" />
            新增 PSP
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} className="group rounded-card border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand">
                <action.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-black text-slate-950 group-hover:text-brand">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{action.text}</p>
            </Link>
          ))}
        </div>
      </section>
      <section id="orders" className="mt-8 grid gap-8 xl:grid-cols-2">
        <Panel title="商户管理" id="merchants">
          <div className="mb-3">
            <SearchInput placeholder="Search merchants" />
          </div>
          <DataTable columns={["商户", "状态", "余额", "操作"]} rows={merchantRows} />
        </Panel>
        <Panel title="订单管理">
          <div className="mb-3">
            <SearchInput placeholder="Search orders" />
          </div>
          <DataTable columns={["订单号", "商户订单", "状态", "金额", "Payment Attempts"]} rows={orderRows} />
        </Panel>
      </section>
      <section id="withdraws" className="mt-8 grid gap-8 xl:grid-cols-2">
        <Panel title="提现审核">
          <AdminWithdrawActions withdraws={withdraws} />
        </Panel>
        <Panel title="Webhook 日志" id="webhooks">
          <DataTable columns={["订单", "事件", "状态", "响应", "URL"]} rows={webhookRows} />
        </Panel>
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-3">
        <Panel title="PSP 管理" id="psp">
          <MiniCard title="Primary PSP" text="Mock provider, active, 1.8% fee, primary channel." tone="success" />
          <MiniCard title="Backup PSP" text="Mock backup, active, failover channel." tone="info" />
        </Panel>
        <Panel title="代理商管理" id="agents">
          <DataTable columns={["代理商", "状态", "商户数", "操作"]} rows={agentRows} />
        </Panel>
        <Panel title="Routing Center" id="routing">
          <MiniCard title="Failover policy" text="Primary channel first, backup channel on provider failure." tone="info" />
          <MiniCard title="Payment attempts" text="Attempts are shown in order detail rows." tone="success" />
        </Panel>
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-3">
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
