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
};

export default async function MerchantCheckoutOrdersPage() {
  const orders = await apiGet<Order[]>("/api/merchant/orders", []);
  const checkoutOrders = orders.filter((order) => !!order.paymentUrl);
  const rows = checkoutOrders.map((order) => [
    order.orderNo,
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.paymentUrl ? (
      <a key={`${order.orderNo}-checkout`} href={order.paymentUrl} className="font-bold text-brand">
        打开 Checkout
      </a>
    ) : "-",
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Checkout Orders" role="Merchant Admin">
      <SectionHeader
        eyebrow="Payments & Orders"
        title="Checkout 订单"
        text="该页面只负责查看 Checkout 订单与支付链接状态。"
        status="ACTIVE"
      />
      <DataTable
        columns={["订单号", "状态", "金额", "Checkout 链接", "创建时间"]}
        rows={rows}
        empty="暂无 Checkout 订单。"
      />
    </DashboardShell>
  );
}
