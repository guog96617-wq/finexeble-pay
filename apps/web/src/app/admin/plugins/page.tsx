import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Plugin = {
  id: string;
  name: string;
  platform: string;
  status: string;
  description?: string | null;
  versions?: { id: string; version: string; downloadUrl: string; status: string }[];
};

export default async function AdminPluginsPage() {
  const plugins = await apiGet<Plugin[]>("/api/admin/plugins", []);
  const rows = plugins.map((plugin) => [
    plugin.name,
    plugin.platform,
    <StatusBadge key={`${plugin.id}-status`} status={plugin.status} />,
    plugin.versions?.[0]?.version ?? "-",
    plugin.versions?.[0]?.downloadUrl ?? "-",
    plugin.description ?? "-",
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Plugin Management" role="Super Admin">
      <SectionHeader
        eyebrow="开发者中心"
        title="插件管理"
        text="展示平台已有插件版本、下载地址和状态，方便运营与渠道同事对外分发。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索插件名称、平台或版本" statusLabel="全部插件状态" />
      <DataTable
        columns={["插件名称", "平台", "状态", "当前版本", "下载地址", "说明"]}
        rows={rows}
        empty="暂无插件数据。"
      />
    </DashboardShell>
  );
}
