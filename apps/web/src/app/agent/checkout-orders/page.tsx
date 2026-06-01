import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Order = {
  orderNo: string;
  status: string;
  amount: string;
  currency: string;
  paymentUrl?: string | null;
  createdAt?: string;
  merchant?: { name?: string };
};

export default async function AgentCheckoutOrdersPage() {
  const orders = await apiGet<Order[]>("/api/agent/orders", []);
  const rows = orders
    .filter((order) => !!order.paymentUrl)
    .map((order) => [
      order.orderNo,
      order.merchant?.name ?? "-",
      <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
      money(order.amount, order.currency),
      order.paymentUrl ? <a key={`${order.orderNo}-checkout`} className="font-bold text-brand" href={order.paymentUrl}>打开 Checkout</a> : "-",
      order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
    ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Checkout Orders" role="Agent Admin">
      <SectionHeader
        eyebrow="Orders & Transactions"
        title="Checkout 订单"
        text="该页面只负责查看 Checkout 链接相关订单。"
        status="ACTIVE"
      />
      <DataTable
        columns={["订单号", "商户", "状态", "金额", "Checkout 链接", "创建时间"]}
        rows={rows}
        empty="暂无 Checkout 订单。"
      />
    </DashboardShell>
  );
}
