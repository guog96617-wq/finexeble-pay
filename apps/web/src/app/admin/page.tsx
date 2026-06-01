import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { AdminWithdrawActions } from "@/components/AdminWithdrawActions";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { OpsMetricCard, PeriodSwitch, RiskPanel, SectionHeader } from "@/components/ProductOps";
import { apiGet, money } from "@/lib/api";
import { Banknote, Boxes, CircleDollarSign, ClipboardList, CreditCard, Landmark, Route, Store, Users } from "lucide-react";
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

type Supplier = { id: string; name: string; status: string; channels?: { id: string; status: string; isPrimary?: boolean; isBackup?: boolean }[] };
type Channel = { id: string; name: string; status: string; isPrimary: boolean; isBackup: boolean };

export default async function AdminPage() {
  const [dashboard, merchants, agents, orders, withdraws, webhookLogs, suppliers, channels] = await Promise.all([
    apiGet<Dashboard>("/api/admin/dashboard", { todayVolume: "0", todayOrders: 0, successRate: 0, activeMerchants: 0, pendingWithdraws: 0 }),
    apiGet<Merchant[]>("/api/admin/merchants", []),
    apiGet<Agent[]>("/api/admin/agents", []),
    apiGet<Order[]>("/api/admin/orders", []),
    apiGet<Withdraw[]>("/api/admin/withdraws", []),
    apiGet<WebhookLog[]>("/api/admin/webhook-logs", []),
    apiGet<Supplier[]>("/api/admin/suppliers", []),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);
  const quickActions = [
    { title: "新增商户", href: "/admin/merchants", icon: Store, text: "进入商户管理页，为新商户开通账号、钱包和支付配置。" },
    { title: "新增代理", href: "/admin/agents", icon: Users, text: "进入代理商管理页，配置代理资源和费率权限。" },
    { title: "新增 PSP", href: "/admin/psp#create-psp", icon: Landmark, text: "添加新的支付供应商，例如 Stripe、Airwallex、Sandbox PSP。" },
    { title: "新增支付通道", href: "/admin/channels#create-channel", icon: Route, text: "在 PSP 下新增银行卡、本地支付或 Sandbox 收银通道。" },
    { title: "查看失败订单", href: "/admin/checkout-orders", icon: CreditCard, text: "集中查看失败支付、失败原因和主备通道尝试记录。" },
    { title: "查看提现审核", href: "/admin#withdraws", icon: Banknote, text: "处理大额提现、高频提现和待支付提现。" },
    { title: "查看风险告警", href: "/admin#risk", icon: CircleDollarSign, text: "查看 PSP、通道、Webhook 和提现风险信号。" },
    { title: "查看 Checkout 订单", href: "/admin/checkout-orders", icon: ClipboardList, text: "查看带 Checkout 链接和支付尝试的订单。" },
  ];
  const failedOrders = orders.filter((order) => order.status === "FAILED").length;
  const paidOrders = orders.filter((order) => order.status === "PAID").length;
  const failureRate = orders.length === 0 ? 0 : Number(((failedOrders / orders.length) * 100).toFixed(2));
  const onlinePsp = suppliers.filter((supplier) => supplier.status === "ACTIVE").length;
  const offlinePsp = suppliers.length - onlinePsp;
  const onlineChannels = channels.filter((channel) => channel.status === "ACTIVE").length;
  const todayProfit = orders.reduce((sum, order) => (order.status === "PAID" ? sum + Number(order.amount) * 0.018 : sum), 0);
  const stats = [
    { label: "今日交易额", value: money(dashboard.todayVolume), tone: "brand" as const, trend: "+12.8%" },
    { label: "今日订单数", value: String(dashboard.todayOrders), tone: "cyan" as const, trend: "+8.1%" },
    { label: "今日成功率", value: `${dashboard.successRate}%`, tone: "success" as const, trend: "+2.4%" },
    { label: "今日失败率", value: `${failureRate}%`, tone: failureRate > 10 ? "danger" as const : "warn" as const, trend: failedOrders ? "+1.2%" : "0%" },
    { label: "在线 PSP 数量", value: String(onlinePsp), tone: "success" as const, trend: "Live" },
    { label: "离线 PSP 数量", value: String(offlinePsp), tone: offlinePsp ? "danger" as const : "neutral" as const, trend: offlinePsp ? "注意" : "0" },
    { label: "在线通道数量", value: String(onlineChannels), tone: "brand" as const, trend: "Routing" },
    { label: "待审核提现", value: String(dashboard.pendingWithdraws), tone: "warn" as const, trend: "Review" },
    { label: "今日平台利润", value: money(todayProfit), tone: "success" as const, trend: "+6.5%" },
    { label: "今日代理利润", value: money(todayProfit * 0.28), tone: "cyan" as const, trend: "+3.4%" },
    { label: "活跃商户数", value: String(dashboard.activeMerchants), tone: "brand" as const, trend: "Live" },
    { label: "活跃代理数", value: String(agents.filter((agent) => agent.status === "ACTIVE").length), tone: "brand" as const, trend: "Live" },
  ];
  const risks = [
    ...(offlinePsp ? [{ title: "PSP 离线", text: `${offlinePsp} 个 PSP 当前不可用，请检查供应商状态。`, level: "CRITICAL" as const }] : []),
    ...(failureRate > 10 ? [{ title: "通道失败率过高", text: `今日失败率 ${failureRate}%，建议查看失败订单与通道 attempts。`, level: "WARNING" as const }] : []),
    ...(webhookLogs.filter((log) => log.status === "FAILED").length ? [{ title: "Webhook 连续失败", text: "发现失败 Webhook 日志，请进入 Webhook Dashboard 查看响应。", level: "WARNING" as const }] : []),
    ...(withdraws.some((withdraw) => Number(withdraw.amount) >= 1000) ? [{ title: "大额提现", text: "存在大额提现申请，建议核对商户历史提现与钱包余额。", level: "INFO" as const }] : []),
    ...(failedOrders > paidOrders ? [{ title: "今日失败订单异常增长", text: "失败订单数量高于成功订单，请优先检查主备通道。", level: "CRITICAL" as const }] : []),
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
      <SectionHeader
        eyebrow="Productized Dashboard"
        title="平台总览"
        text="一打开后台即可看到交易、通道、利润、风险和待处理事项。"
        action={<PeriodSwitch />}
      />
      <section className="grid-fit">
        {stats.map((stat) => (
          <OpsMetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section id="risk" className="mt-8">
        <RiskPanel risks={risks} />
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
