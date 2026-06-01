import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Config = {
  id: string;
  configKey: string;
  configValue: string;
  description?: string | null;
  updatedAt?: string;
};

export default async function AdminSystemSettingsPage() {
  const configs = await apiGet<Config[]>("/api/admin/system-configs", []);
  const rows = configs.map((config) => [
    config.configKey,
    config.configValue,
    config.description ?? "-",
    config.updatedAt ? new Date(config.updatedAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="System Settings" role="Super Admin">
      <SectionHeader
        eyebrow="系统与安全"
        title="系统设置"
        text="展示当前系统配置项，包括平台名称、默认费率和安全限流设置。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索配置键或说明" statusLabel="全部配置" />
      <DataTable
        columns={["配置键", "配置值", "说明", "更新时间"]}
        rows={rows}
        empty="暂无系统配置。"
      />
    </DashboardShell>
  );
}
