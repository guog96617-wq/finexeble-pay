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
    channel: { name: string; paymentMethod: string; currency: string };
  }[];
};

export default async function AdminMerchantChannelStatusPage() {
  const merchants = await apiGet<MerchantStatusRow[]>("/api/admin/merchant-psp-status", []);
  const rows = merchants.map((merchant) => {
    const enabled = merchant.merchantChannels?.filter((item) => item.isEnabled) ?? [];
    const primary = enabled.find((item) => item.isPrimary);
    const backup = enabled.find((item) => item.isBackup);
    return [
      merchant.name,
      merchant.agent?.name ?? "Platform direct",
      `${enabled.length}`,
      primary?.channel.name ?? "Not set",
      backup?.channel.name ?? "Not set",
      enabled.map((item) => `${item.channel.name} (${item.channel.paymentMethod}/${item.channel.currency})`).join(" | ") || "-",
      <StatusBadge key={`${merchant.id}-status`} status={enabled.length ? "ACTIVE" : "PENDING"} />,
      <Link key={`${merchant.id}-detail`} className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}`}>
        Merchant detail
      </Link>,
    ];
  });

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Merchant Channel Supervision" role="Super Admin">
      <SectionHeader
        eyebrow="Merchant supervision"
        title="Merchant channel overview"
        text="Read-only overview of merchant channels, primary routing, backup routing and enabled status. Merchant channel authorization is handled by the agent inside a merchant detail page."
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="Search merchant, agent or channel" statusLabel="All channel states" />
      <DataTable
        columns={["Merchant", "Agent", "Enabled channels", "Primary", "Backup", "Opened channels", "Status", "Action"]}
        rows={rows}
        empty="No merchant channel configuration."
      />
    </DashboardShell>
  );
}
