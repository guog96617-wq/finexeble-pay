import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = {
  channels: {
    id: string;
    isEnabled?: boolean;
    isPrimary: boolean;
    isBackup: boolean;
    channel: {
      name: string;
      paymentMethod: string;
      supplier?: { name: string; status?: string };
    };
  }[];
};

export default async function MerchantPspStatusPage() {
  const payload = await apiGet<Payload>("/api/merchant/payment-methods", { channels: [] });

  const rows = payload.channels.map((item) => [
    item.channel.supplier?.name ?? "-",
    item.channel.name,
    item.channel.paymentMethod,
    <StatusBadge key={`${item.id}-status`} status={item.channel.supplier?.status ?? "ACTIVE"} />,
    item.isPrimary ? "主通道" : item.isBackup ? "备用通道" : "普通通道",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="PSP / Channel Status" role="Merchant Admin">
      <SectionHeader
        eyebrow="Payment Methods"
        title="PSP / 通道状态"
        text="该页面仅用于查看当前可用 PSP 与通道状态。"
        status="ACTIVE"
      />
      <DataTable
        columns={["PSP", "通道", "支付方式", "状态", "角色"]}
        rows={rows}
        empty="暂无可用 PSP / 通道。"
      />
    </DashboardShell>
  );
}
