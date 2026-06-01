import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
  failedReason?: string | null;
  merchant?: { name: string } | null;
  channel?: { name: string } | null;
  attempts?: { attemptNo: number; status: string; errorMessage?: string | null; channel?: { name: string } | null }[];
};

export default async function AdminOrdersPage() {
  const orders = await apiGet<Order[]>("/api/admin/orders", []);
  const rows = orders.map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    order.merchant?.name ?? "-",
    <StatusBadge key={`${order.id}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.channel?.name ?? "-",
    order.attempts?.map((attempt) => `${attempt.attemptNo}.${attempt.status}${attempt.channel?.name ? ` ${attempt.channel.name}` : ""}`).join(" / ") ?? "-",
    order.failedReason ?? "-",
    <Link key={`${order.id}-view`} className="button secondary px-3 py-2 text-xs" href={`/admin/checkout-orders`}>
      查看 Checkout 订单
    </Link>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Order Management" role="Super Admin">
      <SectionHeader
        eyebrow="支付运营"
        title="订单管理"
        text="集中查看订单状态、失败原因、Payment Attempts 和当前路由通道。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索订单号、商户订单号、商户名" statusLabel="全部订单状态" />
      <DataTable
        columns={["平台订单号", "商户订单号", "商户", "状态", "金额", "当前通道", "Payment Attempts", "失败原因", "操作"]}
        rows={rows}
        empty="暂无订单记录。"
      />
    </DashboardShell>
  );
}
