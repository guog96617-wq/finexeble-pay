import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type SdkItem = { language: string; package: string; version: string };

export default async function MerchantSdkPage() {
  const sdk = await apiGet<SdkItem[]>("/api/merchant/sdk", []);
  const rows = sdk.map((item) => [item.language, item.package, item.version]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="SDK Downloads" role="Merchant Admin">
      <SectionHeader
        eyebrow="开发者"
        title="SDK 下载"
        text="查看当前支持的 SDK 包名和版本，便于技术同事快速接入。"
        status="ACTIVE"
      />
      <DataTable
        columns={["语言", "包名", "版本"]}
        rows={rows}
        empty="暂无 SDK 信息。"
      />
    </DashboardShell>
  );
}
