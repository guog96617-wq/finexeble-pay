import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SearchInput } from "@/components/SearchInput";
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
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}/psp`}>设置 PSP / 通道</Link>
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}/psp#merchant-fees`}>设置商户费率</Link>
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}/psp#withdraw-rule`}>设置提现规则</Link>
      <Link className="button secondary px-3 py-2 text-xs" href="/admin#orders">查看订单</Link>
      <Link className="button secondary px-3 py-2 text-xs" href="/admin#wallet">查看钱包</Link>
    </div>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="商户管理" role="Super Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-950">商户管理</h2>
        <p className="mt-2 text-sm text-muted">查看商户、所属代理、钱包余额，并进入商户 PSP、费率和提现规则配置。</p>
      </div>
      <div className="mb-4">
        <SearchInput placeholder="搜索商户、邮箱或代理" />
      </div>
      <section id="merchant-fees">
        <DataTable columns={["商户", "邮箱", "所属代理", "国家/地区", "状态", "可用余额", "操作"]} rows={rows} empty="暂无商户。演示账号 seed 后会显示默认商户。" />
      </section>
    </DashboardShell>
  );
}
