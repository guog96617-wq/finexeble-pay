import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import { InsightCard, OpsMetricCard, PeriodSwitch, RiskPanel, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Dashboard = {
  todayVolume: string;
  todayOrders: number;
  successRate: number;
  activeMerchants: number;
  pendingWithdraws: number;
};

type Channel = { id: string; name: string; status: string; isPrimary: boolean; isBackup: boolean };
type Supplier = { id: string; name: string; status: string };
type Order = {
  id: string;
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
  attempts?: { attemptNo: number; status: string; channel?: { name: string } | null }[];
};
type Withdraw = { id: string; withdrawNo: string; status: string; amount: string; currency: string; merchant?: { name: string } | null };
type WebhookLog = { status: string; url: string; requestPayload?: { orderNo?: string } | null; order?: { orderNo: string } | null };

export default async function AdminPage() {
  const [dashboard, orders, withdraws, webhookLogs, suppliers, channels] = await Promise.all([
    apiGet<Dashboard>("/api/admin/dashboard", { todayVolume: "0", todayOrders: 0, successRate: 0, activeMerchants: 0, pendingWithdraws: 0 }),
    apiGet<Order[]>("/api/admin/orders", []),
    apiGet<Withdraw[]>("/api/admin/withdraws", []),
    apiGet<WebhookLog[]>("/api/admin/webhook-logs", []),
    apiGet<Supplier[]>("/api/admin/suppliers", []),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);

  const failedOrders = orders.filter((order) => order.status === "FAILED").length;
  const failureRate = orders.length === 0 ? 0 : Number(((failedOrders / orders.length) * 100).toFixed(2));
  const offlinePsp = suppliers.filter((supplier) => supplier.status !== "ACTIVE").length;
  const todayProfit = orders.reduce((sum, order) => (order.status === "PAID" ? sum + Number(order.amount) * 0.018 : sum), 0);
  const platformStatus = offlinePsp || failureRate > 10 ? "WARNING" : "ACTIVE";

  const stats = [
    { label: "今日交易额", value: money(dashboard.todayVolume), tone: "brand" as const, trend: "+12.8%" },
    { label: "今日成功率", value: `${dashboard.successRate}%`, tone: "success" as const, trend: "+2.4%" },
    { label: "在线 PSP", value: String(suppliers.length - offlinePsp), tone: "success" as const, trend: "Live" },
    { label: "活跃商户", value: String(dashboard.activeMerchants), tone: "brand" as const, trend: "Live" },
    { label: "待审核提现", value: String(dashboard.pendingWithdraws), tone: "warn" as const, trend: "Review" },
    { label: "今日利润", value: money(todayProfit), tone: "success" as const, trend: "+6.5%" },
  ];

  const risks = [
    ...(offlinePsp ? [{ title: "PSP 离线", text: `${offlinePsp} 个 PSP 当前不可用，请进入 PSP 管理检查供应商状态。`, level: "CRITICAL" as const }] : []),
    ...(failureRate > 10 ? [{ title: "通道异常", text: `今日失败率 ${failureRate}%，请进入通道管理或 Checkout 订单排查。`, level: "WARNING" as const }] : []),
    ...(webhookLogs.filter((log) => log.status === "FAILED").length ? [{ title: "Webhook 失败", text: "发现失败 Webhook 日志，请进入 Webhook 模块查看。", level: "WARNING" as const }] : []),
    ...(withdraws.some((withdraw) => Number(withdraw.amount) >= 1000) ? [{ title: "大额提现", text: "存在大额提现申请，请进入提现审核模块处理。", level: "INFO" as const }] : []),
  ];

  const recentWithdrawRows = withdraws.slice(0, 5).map((withdraw) => [
    withdraw.withdrawNo,
    withdraw.merchant?.name ?? "-",
    <StatusBadge key={`${withdraw.id}-status`} status={withdraw.status} />,
    money(withdraw.amount, withdraw.currency),
  ]);
  const failedOrderRows = orders.filter((order) => order.status === "FAILED").slice(0, 5).map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    <StatusBadge key={`${order.id}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.attempts?.map((attempt) => `${attempt.attemptNo}.${attempt.status}${attempt.channel?.name ? ` ${attempt.channel.name}` : ""}`).join(" / ") ?? "-",
  ]);
  const abnormalRows = [
    ...webhookLogs.filter((log) => log.status === "FAILED").slice(0, 3).map((log) => ["Webhook 失败", log.order?.orderNo ?? log.requestPayload?.orderNo ?? "-", log.url]),
    ...channels.filter((channel) => channel.status !== "ACTIVE").slice(0, 3).map((channel) => ["通道异常", channel.name, channel.status]),
    ...suppliers.filter((supplier) => supplier.status !== "ACTIVE").slice(0, 3).map((supplier) => ["PSP 离线", supplier.name, supplier.status]),
  ];

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Dashboard" role="Super Admin">
      <SectionHeader
        eyebrow="仪表台"
        title="平台总览中心"
        status={platformStatus}
        text="Dashboard 只展示平台数据、风险告警、趋势和最近事件。新增、编辑、费率、提现审核等操作请进入对应模块页面。"
        action={<PeriodSwitch />}
      />
      <section className="grid-fit">
        {stats.map((stat) => <OpsMetricCard key={stat.label} {...stat} />)}
      </section>
      <section id="risk" className="mt-8">
        <RiskPanel risks={risks} />
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <InsightCard title="交易趋势" text="观察交易额波动，异常时进入 Checkout 订单模块排查。">
          <SimpleBars labels={["今日交易额", "7天交易额", "30天交易额", "成功订单", "失败订单"]} />
        </InsightCard>
        <InsightCard title="成功率趋势" text="仅做观察，不在 Dashboard 调整通道或 PSP。">
          <SimpleBars labels={["今日成功率", "7天成功率", "30天成功率", "主通道", "备用通道"]} />
        </InsightCard>
        <InsightCard title="利润趋势" text="用于经营判断，具体费率配置进入费率与利润相关模块。">
          <SimpleBars labels={["今日利润", "7天利润", "30天利润", "代理利润", "PSP 成本"]} />
        </InsightCard>
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-3">
        <Panel title="最近提现">
          <DataTable columns={["提现单", "商户", "状态", "金额"]} rows={recentWithdrawRows} empty="暂无最近提现。" />
        </Panel>
        <Panel title="最近失败订单">
          <DataTable columns={["订单号", "商户订单", "状态", "金额", "Payment Attempts"]} rows={failedOrderRows} empty="暂无失败订单。" />
        </Panel>
        <Panel title="最近异常">
          <DataTable columns={["类型", "对象", "状态/说明"]} rows={abnormalRows} empty="暂无异常事件。" />
        </Panel>
      </section>
    </DashboardShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-black text-slate-950">{title}</h2>
      {children}
    </div>
  );
}
