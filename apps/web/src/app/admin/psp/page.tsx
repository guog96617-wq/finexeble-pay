import { DashboardShell } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { ListToolbar, OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { CreatePspForm, SupplierActionButtons } from "@/components/V15Forms";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Supplier = { id: string; name: string; country?: string | null; contactName?: string | null; email?: string | null; status: string; apiBaseUrl: string; createdAt?: string; channels?: { id: string; name: string; status: string; isPrimary?: boolean; isBackup?: boolean }[] };
type Order = { status: string; amount: string; attempts?: { status: string; channel?: { supplierId?: string } | null }[] };

export default async function AdminPspPage() {
  const [suppliers, orders] = await Promise.all([
    apiGet<Supplier[]>("/api/admin/suppliers", []),
    apiGet<Order[]>("/api/admin/orders", []),
  ]);
  const paid = orders.filter((order) => order.status === "PAID").length;
  const successRate = orders.length === 0 ? 0 : Number(((paid / orders.length) * 100).toFixed(2));
  const totalAmount = orders.reduce((sum, order) => sum + Number(order.amount), 0);
  const rows = suppliers.map((supplier) => [
    supplier.name,
    supplier.country ?? "-",
    <StatusBadge key={`${supplier.id}-status`} status={supplier.status} />,
    <span key={`${supplier.id}-api`} className="max-w-[280px] truncate">{supplier.apiBaseUrl}</span>,
    `${supplier.channels?.length ?? 0}`,
    supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : "-",
    <div key={`${supplier.id}-actions`} className="flex flex-wrap gap-2">
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/psp#${supplier.id}`}>查看</Link>
      <SupplierActionButtons id={supplier.id} />
    </div>,
  ]);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="PSP 管理" role="Super Admin">
      <SectionHeader
        eyebrow="PSP Operations"
        title="PSP 管理"
        text="PSP 页面不仅用于配置，也用于观察供应商在线状态、交易表现和主备通道结构。"
        action={<Link href="#create-psp" className="button">新增 PSP</Link>}
      />
      <section className="mb-6 grid-fit">
        <OpsMetricCard label="在线 PSP" value={String(suppliers.filter((supplier) => supplier.status === "ACTIVE").length)} tone="success" trend="ONLINE" />
        <OpsMetricCard label="离线 PSP" value={String(suppliers.filter((supplier) => supplier.status !== "ACTIVE").length)} tone="danger" trend="OFFLINE" />
        <OpsMetricCard label="今日交易量" value={money(totalAmount)} tone="brand" trend="+9.2%" />
        <OpsMetricCard label="今日成功率" value={`${successRate}%`} tone="success" trend="+1.8%" />
        <OpsMetricCard label="今日失败率" value={`${orders.length === 0 ? 0 : Number((((orders.length - paid) / orders.length) * 100).toFixed(2))}%`} tone="warn" trend="Watch" />
        <OpsMetricCard label="平均耗时" value="428ms" tone="cyan" trend="-6%" />
        <OpsMetricCard label="今日利润" value={money(totalAmount * 0.018)} tone="success" trend="+4.5%" />
        <OpsMetricCard label="主/备通道" value={`${suppliers.flatMap((supplier) => supplier.channels ?? []).filter((channel) => channel.isPrimary).length}/${suppliers.flatMap((supplier) => supplier.channels ?? []).filter((channel) => channel.isBackup).length}`} tone="brand" trend="Routing" />
      </section>
      <ListToolbar searchPlaceholder="搜索 PSP 名称、国家或 API 地址" statusLabel="全部 PSP 状态" />
      <section className="grid gap-6 xl:grid-cols-[.78fr_1.22fr]">
        <CreatePspForm />
        <div>
          <DataTable columns={["PSP 名称", "国家/地区", "状态", "API 地址", "通道数量", "创建时间", "操作"]} rows={rows} empty="还没有 PSP，请先点击新增 PSP。" />
        </div>
      </section>
    </DashboardShell>
  );
}
