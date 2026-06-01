import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { Pagination } from "@/components/Pagination";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";
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
    agent.commissionRate ? `${Number(agent.commissionRate) * 100}%` : "-",
    <div key={`${agent.id}-actions`} className="flex flex-wrap gap-2">
      <Link className="button secondary px-3 py-2 text-xs" href={`/admin/agents/${agent.id}`}>查看</Link>
    </div>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="代理商管理" role="Super Admin">
      <SectionHeader eyebrow="代理体系" title="代理管理" status="ACTIVE" text="此页面只负责代理列表、代理状态和进入代理详情。最低费率、PSP 权限和名下商户在代理详情页处理。" />
      <ListToolbar searchPlaceholder="搜索代理商、联系人或邮箱" statusLabel="全部代理状态" />
      <section>
        <DataTable columns={["代理商", "联系人", "邮箱", "状态", "名下商户", "默认佣金", "操作"]} rows={rows} empty="暂无代理商。演示账号 seed 后会显示默认代理。" />
        <Pagination page={1} totalPages={1} />
      </section>
    </DashboardShell>
  );
}
