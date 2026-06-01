import { DashboardShell } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { CreatePspForm, SupplierActionButtons } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Supplier = { id: string; name: string; country?: string | null; contactName?: string | null; email?: string | null; status: string; apiBaseUrl: string; createdAt?: string; channels?: { id: string; name: string; status: string }[] };

export default async function AdminPspPage() {
  const suppliers = await apiGet<Supplier[]>("/api/admin/suppliers", []);
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-950">PSP 管理</h2>
          <p className="mt-2 text-sm text-muted">管理平台接入的支付供应商，查看状态、API 地址和通道数量。</p>
        </div>
        <Link href="#create-psp" className="button">新增 PSP</Link>
      </div>
      <section className="grid gap-6 xl:grid-cols-[.78fr_1.22fr]">
        <CreatePspForm />
        <div>
          <DataTable columns={["PSP 名称", "国家/地区", "状态", "API 地址", "通道数量", "创建时间", "操作"]} rows={rows} empty="还没有 PSP，请先点击新增 PSP。" />
        </div>
      </section>
    </DashboardShell>
  );
}
