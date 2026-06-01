import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type User = {
  id: string;
  email: string;
  role: string;
  status: string;
  merchant?: { name?: string } | null;
  agent?: { name?: string } | null;
  lastLoginAt?: string | null;
};

export default async function AdminUsersPage() {
  const users = await apiGet<User[]>("/api/admin/users", []);
  const rows = users.map((user) => [
    user.email,
    user.role,
    user.merchant?.name ?? user.agent?.name ?? "平台用户",
    <StatusBadge key={`${user.id}-status`} status={user.status} />,
    user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "未登录",
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="User Management" role="Super Admin">
      <SectionHeader
        eyebrow="系统与安全"
        title="用户管理"
        text="查看后台账号、角色归属与最近登录状态。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索邮箱、角色或归属对象" statusLabel="全部用户状态" />
      <DataTable
        columns={["邮箱", "角色", "归属对象", "状态", "最近登录"]}
        rows={rows}
        empty="暂无用户记录。"
      />
    </DashboardShell>
  );
}
