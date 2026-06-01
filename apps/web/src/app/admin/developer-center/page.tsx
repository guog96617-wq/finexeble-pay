import { DashboardShell } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Plugin = {
  id: string;
  name: string;
  platform: string;
  versions?: { version: string; downloadUrl: string }[];
};

export default async function AdminDeveloperCenterPage() {
  const plugins = await apiGet<Plugin[]>("/api/admin/plugins", []);
  const rows = plugins.map((plugin) => [
    plugin.name,
    plugin.platform,
    plugin.versions?.[0]?.version ?? "-",
    plugin.versions?.[0]?.downloadUrl ?? "-",
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Developer Center" role="Super Admin">
      <SectionHeader
        eyebrow="开发者中心"
        title="SDK / Docs 管理"
        text="集中查看 API 文档、插件包和对外开发者交付资料。"
        status="ACTIVE"
        action={<Link href="/docs/api" className="button">打开 API 文档</Link>}
      />
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">API 文档</h3>
          <p className="mt-2 text-sm text-slate-700">Swagger、签名规则和支付/回调验收路径都从这里进入。</p>
        </div>
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">SDK 交付</h3>
          <p className="mt-2 text-sm text-slate-700">当前系统已提供 Node.js / PHP / Java / Python 的接入说明。</p>
        </div>
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">插件包</h3>
          <p className="mt-2 text-sm text-slate-700">Shopify、WooCommerce、Shopline、Magento、OpenCart 插件已在种子数据中初始化。</p>
        </div>
      </section>
      <section className="mt-8">
        <SectionHeader title="插件版本清单" text="运营可从这里核对当前对外分发的版本与下载地址。" />
        <DataTable
          columns={["插件名称", "平台", "当前版本", "下载地址"]}
          rows={rows}
          empty="暂无插件版本信息。"
        />
      </section>
    </DashboardShell>
  );
}
