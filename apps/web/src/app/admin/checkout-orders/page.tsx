import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SearchInput } from "@/components/SearchInput";
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
  paymentUrl?: string | null;
  merchant?: { name: string } | null;
  attempts?: { attemptNo: number; status: string; channel?: { name: string } | null }[];
};

export default async function AdminCheckoutOrdersPage() {
  const orders = await apiGet<Order[]>("/api/admin/orders", []);
  const rows = orders.map((order) => [
    order.orderNo,
    order.merchant?.name ?? "-",
    <StatusBadge key={`${order.id}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.paymentUrl ? <Link key={`${order.id}-checkout`} className="font-bold text-brand" href={order.paymentUrl}>打开 Checkout</Link> : "-",
    order.attempts?.map((attempt) => `${attempt.attemptNo}.${attempt.status}${attempt.channel?.name ? ` ${attempt.channel.name}` : ""}`).join(" / ") ?? "-",
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Checkout 订单" role="Super Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-950">Checkout 订单</h2>
        <p className="mt-2 text-sm text-muted">查看订单支付链接、支付状态和 payment attempts，方便运营排查支付过程。</p>
      </div>
      <div className="mb-4">
        <SearchInput placeholder="搜索订单号或商户订单号" />
      </div>
      <DataTable columns={["订单号", "商户", "状态", "金额", "Checkout 链接", "Payment Attempts"]} rows={rows} empty="暂无 Checkout 订单。" />
    </DashboardShell>
  );
}
