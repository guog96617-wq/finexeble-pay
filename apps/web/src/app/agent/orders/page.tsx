import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Order = {
  orderNo: string;
  status: string;
  amount: string;
  currency: string;
  createdAt?: string;
  merchant?: { name?: string };
};

export default async function AgentOrdersPage() {
  const orders = await apiGet<Order[]>("/api/agent/orders", []);
  const rows = orders.map((order) => [
    order.orderNo,
    order.merchant?.name ?? "-",
    <StatusBadge key={`${order.orderNo}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Order Management" role="Agent Admin">
      <SectionHeader
        eyebrow="Orders & Transactions"
        title="订单管理"
        text="该页面只负责查看名下商户订单。"
        status="ACTIVE"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <SearchInput placeholder="搜索订单号 / 商户名称" />
        <select defaultValue="ALL" aria-label="订单状态筛选">
          <option value="ALL">全部状态</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>
      <DataTable
        columns={["订单号", "商户", "状态", "金额", "创建时间"]}
        rows={rows}
        empty="暂无订单。"
      />
    </DashboardShell>
  );
}
