import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { Pagination } from "@/components/Pagination";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Merchant = {
  id: string;
  name: string;
  email?: string | null;
  country?: string | null;
  status: string;
  agent?: { name: string } | null;
  wallet?: { balance: string; availableBalance: string; currency: string } | null;
};

export default async function AdminMerchantsPage() {
  const merchants = await apiGet<Merchant[]>("/api/admin/merchants", []);
  const rows = merchants.map((merchant) => [
    merchant.name,
    merchant.email ?? "-",
    merchant.agent?.name ?? "平台直属",
    merchant.country ?? "-",
    <StatusBadge key={`${merchant.id}-status`} status={merchant.status} />,
    money(merchant.wallet?.availableBalance, merchant.wallet?.currency ?? "USD"),
    <div key={`${merchant.id}-actions`} className="flex flex-wrap gap-2">
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}`}>查看</Link>
    </div>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="商户管理" role="Super Admin">
      <SectionHeader eyebrow="商户体系" title="商户管理" status="ACTIVE" text="此页面只负责商户列表、商户状态和进入 Merchant 360。商户 PSP、费率、提现规则等复杂运营操作在 Merchant 360 内完成。" />
      <ListToolbar searchPlaceholder="搜索商户、邮箱或代理" statusLabel="全部商户状态" />
      <section>
        <DataTable columns={["商户", "邮箱", "所属代理", "国家/地区", "状态", "可用余额", "操作"]} rows={rows} empty="暂无商户。演示账号 seed 后会显示默认商户。" />
        <Pagination page={1} totalPages={1} />
      </section>
    </DashboardShell>
  );
}
