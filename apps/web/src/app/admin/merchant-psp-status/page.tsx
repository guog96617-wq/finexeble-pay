import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type MerchantStatusRow = {
  id: string;
  name: string;
  agent?: { name: string } | null;
  merchantChannels?: {
    channelId: string;
    isEnabled: boolean;
    isPrimary: boolean;
    isBackup: boolean;
    merchantFeeRate?: string;
    channel: {
      name: string;
      paymentMethod: string;
      supplier?: { name: string; status: string };
    };
  }[];
};

export default async function AdminMerchantPspStatusPage() {
  const merchants = await apiGet<MerchantStatusRow[]>("/api/admin/merchant-psp-status", []);
  const rows = merchants.map((merchant) => {
    const enabled = merchant.merchantChannels?.filter((item) => item.isEnabled) ?? [];
    const primary = enabled.find((item) => item.isPrimary);
    const backup = enabled.find((item) => item.isBackup);
    return [
      merchant.name,
      merchant.agent?.name ?? "平台直属",
      `${enabled.length}`,
      primary?.channel.name ?? "未设置",
      backup?.channel.name ?? "未设置",
      enabled.map((item) => `${item.channel.supplier?.name ?? "-"} / ${item.channel.name}`).join(" | ") || "-",
      <StatusBadge key={`${merchant.id}-status`} status={enabled.length ? "ACTIVE" : "PENDING"} />,
      <Link key={`${merchant.id}-config`} className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}/psp`}>
        配置商户 PSP
      </Link>,
    ];
  });

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Merchant PSP Status" role="Super Admin">
      <SectionHeader
        eyebrow="费率与利润"
        title="商户 PSP 配置总览"
        text="查看每个商户当前开通的 PSP、主备通道和启用状态。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索商户、代理或通道" statusLabel="全部配置状态" />
      <DataTable
        columns={["商户", "所属代理", "已启用通道", "主通道", "备用通道", "已开通 PSP / 通道", "状态", "操作"]}
        rows={rows}
        empty="暂无商户 PSP 配置。"
      />
    </DashboardShell>
  );
}
