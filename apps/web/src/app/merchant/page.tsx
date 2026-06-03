import { CheckoutLinkActions } from "@/components/CheckoutLinkActions";
import { CheckoutStatusBadge } from "@/components/CheckoutStatusBadge";
import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Dashboard = {
  todayReceipts: string;
  yesterdayReceipts: string;
  totalOrders: number;
  successRate: number;
  availableBalance: string;
};

type Wallet = {
  balance: string;
  availableBalance: string;
  frozenBalance: string;
  currency: string;
};

type Order = {
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
  paymentUrl?: string | null;
  createdAt?: string;
  attempts?: { requestPayload?: { sandboxResult?: string } | null }[];
};

type Withdraw = {
  withdrawNo: string;
  status: string;
  amount: string;
  currency: string;
  createdAt?: string;
};

export default async function MerchantDashboardPage() {
  const [dashboard, wallet, orders, withdraws] = await Promise.all([
    apiGet<Dashboard>("/api/merchant/dashboard", {
      todayReceipts: "0",
      yesterdayReceipts: "0",
      totalOrders: 0,
      successRate: 0,
      availableBalance: "0",
    }),
    apiGet<Wallet | null>("/api/merchant/wallet", null),
    apiGet<Order[]>("/api/merchant/orders", []),
    apiGet<Withdraw[]>("/api/merchant/withdraws", []),
  ]);

  const currency = wallet?.currency ?? "USD";
  const stats = [
    { label: "今日收入", value: money(dashboard.todayReceipts, currency), tone: "success" as const, trend: "Today" },
    { label: "今日订单", value: String(dashboard.totalOrders), tone: "brand" as const, trend: "Live" },
    { label: "成功率", value: `${dashboard.successRate}%`, tone: "success" as const, trend: "Quality" },
    { label: "可提现余额", value: money(dashboard.availableBalance, currency), tone: "warn" as const, trend: "Available" },
    { label: "冻结金额", value: money(wallet?.frozenBalance ?? 0, currency), tone: "cyan" as const, trend: "Frozen" },
    {
      label: "今日变化",
      value: money(Number(dashboard.todayReceipts) - Number(dashboard.yesterdayReceipts), currency),
      tone: "brand" as const,
      trend: "vs Yesterday",
    },
  ];

  const recentOrderRows = orders.slice(0, 6).map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  ]);

  const isTimeoutOrder = (order: Order) => order.attempts?.some((attempt) => attempt.requestPayload?.sandboxResult === "timeout") ?? false;
  const recentCheckoutRows = orders.filter((order) => !!order.paymentUrl).slice(0, 6).map((order) => [
    order.orderNo,
    money(order.amount, order.currency),
    <CheckoutStatusBadge key={`${order.orderNo}-checkout-status`} status={order.status} isTimeout={isTimeoutOrder(order)} />,
    <CheckoutLinkActions key={`${order.orderNo}-checkout`} orderNo={order.orderNo} showCopy={false} />,
  ]);

  const recentWithdrawRows = withdraws.slice(0, 6).map((withdraw) => [
    withdraw.withdrawNo,
    <StatusBadge key={`${withdraw.withdrawNo}-status`} status={withdraw.status} />,
    money(withdraw.amount, withdraw.currency),
    withdraw.createdAt ? new Date(withdraw.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Merchant Dashboard" role="Merchant Admin">
      <SectionHeader
        eyebrow="Merchant Overview"
        title="商户运营总览"
        text="这里仅展示经营数据概览。订单创建、提现申请、支付方式配置已拆分到独立模块。"
        status="ACTIVE"
      />
      <section className="grid-fit">
        {stats.map((stat) => (
          <OpsMetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="mt-8">
        <SectionHeader title="最近 Checkout 订单" text="最近 6 笔可进入收银台的订单，便于运营快速核对支付状态。" />
        <DataTable
          columns={["订单号", "金额", "状态", "查看收银台"]}
          rows={recentCheckoutRows}
          empty="暂无 Checkout 订单。"
        />
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div>
          <SectionHeader title="最近订单" text="最近 6 笔订单状态，便于快速查看交易运行情况。" />
          <DataTable
            columns={["订单号", "商户单号", "状态", "金额", "时间"]}
            rows={recentOrderRows}
            empty="暂无订单记录。"
          />
        </div>
        <div>
          <SectionHeader title="最近提现" text="最近 6 笔提现状态，提现申请请前往资金中心模块。" />
          <DataTable
            columns={["提现单号", "状态", "金额", "时间"]}
            rows={recentWithdrawRows}
            empty="暂无提现记录。"
          />
        </div>
      </section>
    </DashboardShell>
  );
}
