import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Agent = {
  id: string;
  name: string;
  email?: string | null;
  contactName?: string | null;
  status: string;
  commissionRate?: string | null;
  merchants?: { id: string; name: string; status: string }[];
};

export default async function AdminAgentsPage() {
  const agents = await apiGet<Agent[]>("/api/admin/agents", []);
  const rows = agents.map((agent) => [
    agent.name,
    agent.contactName ?? "-",
    agent.email ?? "-",
    <StatusBadge key={`${agent.id}-status`} status={agent.status} />,
    `${agent.merchants?.length ?? 0} 个商户`,
    agent.commissionRate ? `${Number(agent.commissionRate) * 100}%` : money(0),
    <div key={`${agent.id}-actions`} className="flex flex-wrap gap-2">
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/agents/${agent.id}/fee-rules`}>设置费率权限</Link>
      <Link className="button secondary px-3 py-2 text-xs" href="/admin/psp">管理可用 PSP</Link>
      <Link className="button secondary px-3 py-2 text-xs" href="/admin/merchants">查看名下商户</Link>
    </div>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="代理商管理" role="Super Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-950">代理商管理</h2>
        <p className="mt-2 text-sm text-muted">查看代理商、名下商户数量，并进入代理费率权限配置。</p>
      </div>
      <div className="mb-4">
        <SearchInput placeholder="搜索代理商、联系人或邮箱" />
      </div>
      <section id="fee-rules">
        <DataTable columns={["代理商", "联系人", "邮箱", "状态", "名下商户", "默认佣金", "操作"]} rows={rows} empty="暂无代理商。演示账号 seed 后会显示默认代理。" />
      </section>
      <div className="mt-6 rounded-card border border-blue-100 bg-blue-50/70 p-5">
        <h3 className="font-black text-slate-950">费率权限怎么理解？</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">平台先给代理设置最低商户费率。代理给商户设置 10% 或 12% 可以，设置 9% 会被系统拒绝。</p>
      </div>
    </DashboardShell>
  );
}
