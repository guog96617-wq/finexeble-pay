import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
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
  id?: string;
  name: string;
  status: string;
};

type Order = {
  orderNo: string;
  status: string;
  amount: string;
  currency: string;
  createdAt?: string;
  merchant?: { name?: string };
};

type Commission = {
  orderNo: string;
  commissionAmount: number;
};

export default async function AgentDashboardPage() {
  const [dashboard, merchants, orders, commissions] = await Promise.all([
    apiGet<Dashboard>("/api/agent/dashboard", {
      merchantCount: 0,
      todayVolume: "0",
      totalVolume: "0",
      commissionIncome: "0",
    }),
    apiGet<Merchant[]>("/api/agent/merchants", []),
    apiGet<Order[]>("/api/agent/orders", []),
    apiGet<Commission[]>("/api/agent/commissions", []),
  ]);

  const failedOrders = orders.filter((item) => item.status === "FAILED").slice(0, 6);
  const recentOrders = orders.slice(0, 6);
  const todayCommission = commissions.reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const successRate = orders.length ? (((orders.length - failedOrders.length) / orders.length) * 100).toFixed(2) : "0.00";

  const stats = [
    { label: "今日佣金", value: money(todayCommission), tone: "success" as const, trend: "Today" },
    { label: "商户成功率", value: `${successRate}%`, tone: "success" as const, trend: "Quality" },
    { label: "今日交易额", value: money(dashboard.todayVolume), tone: "brand" as const, trend: "Live" },
    { label: "活跃商户", value: String(dashboard.merchantCount), tone: "cyan" as const, trend: "Active" },
    { label: "累计交易额", value: money(dashboard.totalVolume), tone: "brand" as const, trend: "All Time" },
    { label: "累计佣金", value: money(dashboard.commissionIncome), tone: "warn" as const, trend: "Revenue" },
  ];

  const recentOrderRows = recentOrders.map((order) => [
    order.orderNo,
    order.merchant?.name ?? "-",
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  ]);

  const abnormalRows = failedOrders.map((order) => [
    order.orderNo,
    order.merchant?.name ?? "-",
    <StatusBadge key={`${order.orderNo}-abnormal`} status={order.status} />,
    money(order.amount, order.currency),
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Agent Dashboard" role="Agent Admin">
      <SectionHeader
        eyebrow="Agent Overview"
        title="代理运营总览"
        text="这里仅展示代理经营概览。商户管理、费率配置、PSP 开关和提现管理已拆分到独立模块。"
        status="ACTIVE"
      />
      <section className="grid-fit">
        {stats.map((stat) => (
          <OpsMetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div>
          <SectionHeader title="最近订单" text="最近 6 笔交易，便于快速掌握整体交易状态。" />
          <DataTable
            columns={["订单号", "商户", "状态", "金额", "时间"]}
            rows={recentOrderRows}
            empty="暂无订单记录。"
          />
        </div>
        <div>
          <SectionHeader title="最近异常" text="失败订单会在这里集中展示，便于运营处理。" status={failedOrders.length ? "WARNING" : "ACTIVE"} />
          <DataTable
            columns={["订单号", "商户", "状态", "金额", "时间"]}
            rows={abnormalRows}
            empty="暂无异常订单。"
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="最近商户" text="最近激活商户列表，更多配置请前往“商户运营”模块。" />
        <DataTable
          columns={["商户名称", "状态"]}
          rows={merchants.slice(0, 8).map((merchant) => [merchant.name, <StatusBadge key={merchant.id ?? merchant.name} status={merchant.status} />])}
          empty="暂无商户。"
        />
      </section>
    </DashboardShell>
  );
}
