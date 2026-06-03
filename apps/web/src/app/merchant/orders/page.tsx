import { CheckoutLinkActions } from "@/components/CheckoutLinkActions";
import { CheckoutStatusBadge } from "@/components/CheckoutStatusBadge";
import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { Pagination } from "@/components/Pagination";
import { SectionHeader } from "@/components/ProductOps";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Order = {
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
  merchantFeeAmount?: string;
  merchantAvailableAmount?: string;
  rollingReserveAmount?: string;
  settlementType?: string;
  settlementDays?: number;
  settlementReleaseAt?: string | null;
  createdAt?: string;
  channel?: { name: string; paymentMethod?: string } | null;
  attempts?: { attemptNo: number; status: string; requestPayload?: { sandboxResult?: string } | null; channel?: { name: string; paymentMethod?: string } | null }[];
};

export default async function MerchantOrdersPage() {
  const orders = await apiGet<Order[]>("/api/merchant/orders", []);
  const isTimeoutOrder = (order: Order) => order.attempts?.some((attempt) => attempt.requestPayload?.sandboxResult === "timeout") ?? false;
  const channelLabel = (order: Order) => order.channel?.name ?? order.attempts?.find((attempt) => attempt.channel)?.channel?.name ?? "-";
  const rows = orders.map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    money(order.amount, order.currency),
    order.currency,
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    channelLabel(order),
    <CheckoutStatusBadge key={`${order.orderNo}-checkout-status`} status={order.status} isTimeout={isTimeoutOrder(order)} />,
    <CheckoutLinkActions key={`${order.orderNo}-copy`} orderNo={order.orderNo} showUrl showView={false} />,
    <CheckoutLinkActions key={`${order.orderNo}-view`} orderNo={order.orderNo} showCopy={false} />,
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Orders" role="Merchant Admin">
      <SectionHeader
        eyebrow="Payments and orders"
        title="Order management"
        text="This page is read-only. Orders should be created automatically by your website, app, plugin, or API integration."
        status="ACTIVE"
      />
      <section className="surface mb-6 p-5">
        <h2 className="text-lg font-black text-slate-950">How to create orders</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Orders should be created by your website, app, plugin, or API integration. Go to the developer center for API documents or plugin integration guides.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="button secondary px-3 py-2 text-xs" href="/docs/api">View API docs</Link>
          <Link className="button secondary px-3 py-2 text-xs" href="/merchant/plugins">View plugin center</Link>
        </div>
      </section>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <SearchInput placeholder="Search order number or merchant order number" />
        <select defaultValue="ALL" aria-label="Order status filter">
          <option value="ALL">All statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>
      <DataTable
        columns={["订单号", "商户单号", "金额", "币种", "状态", "通道", "Checkout 状态", "支付链接", "操作", "创建时间"]}
        rows={rows}
        empty="No orders found."
      />
      <Pagination page={1} totalPages={1} />
    </DashboardShell>
  );
}
