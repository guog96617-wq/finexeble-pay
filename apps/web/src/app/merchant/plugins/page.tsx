import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
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

export default async function MerchantPluginsPage() {
  const plugins = await apiGet<Plugin[]>("/api/merchant/plugins", []);
  const rows = plugins.map((plugin) => [
    plugin.name,
    plugin.platform,
    <StatusBadge key={plugin.id} status={plugin.status} />,
    plugin.versions?.[0]?.version ?? "-",
    plugin.versions?.[0]?.downloadUrl ?? "-",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Plugin Center" role="Merchant Admin">
      <SectionHeader
        eyebrow="开发者"
        title="插件中心"
        text="查看当前可用插件版本和下载地址，方便商户接入电商平台。"
        status="ACTIVE"
      />
      <DataTable
        columns={["插件名称", "平台", "状态", "版本", "下载地址"]}
        rows={rows}
        empty="暂无插件。"
      />
    </DashboardShell>
  );
}
