import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Payload = {
  merchants: {
    id: string;
    name: string;
    merchantChannels?: {
      channelId: string;
      merchantFeeRate?: string;
      channel: { name: string };
    }[];
  }[];
};

export default async function AgentMerchantFeesPage() {
  const payload = await apiGet<Payload>("/api/agent/merchant-fees", { merchants: [] });
  const rows = payload.merchants.flatMap((merchant) =>
    (merchant.merchantChannels ?? []).map((item) => [
      merchant.name,
      item.channel.name,
      `${(Number(item.merchantFeeRate ?? 0) * 100).toFixed(2)}%`,
      <Link key={`${merchant.id}-${item.channelId}`} className="button secondary px-3 py-2 text-xs" href={`/agent/merchants/${merchant.id}`}>
        Edit in merchant detail
      </Link>,
    ]),
  );

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Merchant Fee Settings" role="Agent Admin">
      <SectionHeader
        eyebrow="Merchant operations"
        title="Merchant fee settings"
        text="Merchant channel fees are edited inside each merchant detail page. The guardrail is the agent channel cost authorized by the platform."
        status="ACTIVE"
      />
      <section className="mb-6 grid-fit">
        <OpsMetricCard label="Merchants" value={String(payload.merchants.length)} tone="brand" trend="Under agent" />
        <OpsMetricCard label="Configured channels" value={String(rows.length)} tone="success" trend="Fees" />
      </section>
      <DataTable columns={["Merchant", "Channel", "Merchant fee", "Action"]} rows={rows} empty="No merchant channel fees configured." />
    </DashboardShell>
  );
}
