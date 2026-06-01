import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { Pagination } from "@/components/Pagination";
import { SectionHeader } from "@/components/ProductOps";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Order = {
  orderNo: string;
  merchantOrderNo: string;
  status: string;
  amount: string;
  currency: string;
  createdAt?: string;
  attempts?: { attemptNo: number; status: string; channel?: { name: string } | null }[];
};

export default async function MerchantOrdersPage() {
  const orders = await apiGet<Order[]>("/api/merchant/orders", []);
  const rows = orders.map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.attempts?.map((attempt) => `${attempt.attemptNo}.${attempt.status}${attempt.channel?.name ? ` ${attempt.channel.name}` : ""}`).join(" / ") ?? "-",
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Orders" role="Merchant Admin">
      <SectionHeader
        eyebrow="Payments & Orders"
        title="订单管理"
        text="该页面只负责订单查看与状态跟踪。创建订单请前往“创建订单”页面。"
        status="ACTIVE"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <SearchInput placeholder="搜索订单号 / 商户订单号" />
        <select defaultValue="ALL" aria-label="订单状态筛选">
          <option value="ALL">全部状态</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>
      <DataTable
        columns={["平台订单号", "商户订单号", "状态", "金额", "支付尝试", "创建时间"]}
        rows={rows}
        empty="暂无订单记录。"
      />
      <Pagination page={1} totalPages={1} />
    </DashboardShell>
  );
}
