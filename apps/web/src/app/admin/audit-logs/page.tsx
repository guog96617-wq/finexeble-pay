import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type AuditLog = {
  id: string;
  action: string;
  module: string;
  createdAt: string;
  user?: { email?: string | null } | null;
};

export default async function AdminAuditLogsPage() {
  const logs = await apiGet<AuditLog[]>("/api/admin/audit-logs", []);
  const rows = logs.map((log) => [
    log.action,
    log.module,
    log.user?.email ?? "system",
    new Date(log.createdAt).toLocaleString(),
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Audit Logs" role="Super Admin">
      <SectionHeader
        eyebrow="系统与安全"
        title="审计日志"
        text="查看管理操作、费率调整、PSP 变更和系统级行为记录。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索动作、模块或操作者" statusLabel="全部日志" />
      <DataTable
        columns={["动作", "模块", "操作者", "时间"]}
        rows={rows}
        empty="暂无审计日志。"
      />
    </DashboardShell>
  );
}
