import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Merchant = {
  id: string;
  name: string;
  status: string;
  wallet?: { availableBalance?: string; rollingReserveBalance?: string; currency?: string } | null;
  merchantChannels?: unknown[];
};

export default async function AgentMerchantsPage() {
  const merchants = await apiGet<Merchant[]>("/api/agent/merchants", []);
  const rows = merchants.map((merchant) => {
    const currency = merchant.wallet?.currency ?? "USD";
    return [
      merchant.name,
      <StatusBadge key={`${merchant.id}-status`} status={merchant.status} />,
      money(merchant.wallet?.availableBalance ?? 0, currency),
      money(merchant.wallet?.rollingReserveBalance ?? 0, currency),
      String(merchant.merchantChannels?.length ?? 0),
      <Link key={`${merchant.id}-detail`} className="button secondary px-3 py-2 text-xs" href={`/agent/merchants/${merchant.id}`}>
        Manage channels
      </Link>,
    ];
  });

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="My Merchants" role="Agent Admin">
      <SectionHeader
        eyebrow="Merchant operations"
        title="My merchants"
        text="Open a merchant detail page to enable channels, set merchant fees, and choose primary or backup routing."
        status="ACTIVE"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <SearchInput placeholder="Search merchant name" />
        <select defaultValue="ALL" aria-label="Merchant status filter">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PENDING">PENDING</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>
      <DataTable
        columns={["Merchant", "Status", "Available", "Rolling reserve", "Channels", "Action"]}
        rows={rows}
        empty="No merchants found."
      />
    </DashboardShell>
  );
}
