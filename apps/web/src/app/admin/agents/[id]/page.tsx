import { AgentChannelAuthorization } from "@/components/AgentChannelAuthorization";
import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type AgentPayload = {
  id: string;
  name: string;
  email?: string | null;
  contactName?: string | null;
  status: string;
  merchants: { id: string; name: string; email?: string | null; status: string }[];
  agentChannels: {
    id: string;
    channelId: string;
    isEnabled: boolean;
    agentFeeRate: string;
    agentFixedFee: string;
    note?: string | null;
    channel: { id: string; name: string; pspCostRate?: string; pspFixedFee?: string; paymentMethod: string; currency: string };
  }[];
  metrics: { merchantCount: number; todayVolume: string; todayProfit: string; authorizedChannelCount: number };
};

type Channel = {
  id: string;
  name: string;
  pspCostRate?: string;
  pspFixedFee?: string;
  paymentMethod: string;
  currency: string;
};

export default async function AdminAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [agent, channels] = await Promise.all([
    apiGet<AgentPayload | null>(`/api/admin/agents/${id}`, null),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);

  const merchantRows = (agent?.merchants ?? []).map((merchant) => [
    merchant.name,
    merchant.email ?? "-",
    <StatusBadge key={`${merchant.id}-status`} status={merchant.status} />,
    <Link key={`${merchant.id}-link`} className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}`}>
      Merchant detail
    </Link>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Agent Detail" role="Super Admin">
      <SectionHeader
        eyebrow="Agent operations"
        title={agent?.name ?? "Agent detail"}
        text="Platform authorizes channels to an agent from this page. The global channel library does not contain agent rates."
        status={agent?.status ?? "UNKNOWN"}
      />

      <section className="grid-fit">
        <OpsMetricCard label="Status" value={agent?.status ?? "-"} tone={agent?.status === "ACTIVE" ? "success" : "warn"} trend="Agent" />
        <OpsMetricCard label="Merchants" value={String(agent?.metrics.merchantCount ?? 0)} tone="brand" trend="Under agent" />
        <OpsMetricCard label="Today volume" value={money(agent?.metrics.todayVolume ?? 0)} tone="cyan" trend="Paid orders" />
        <OpsMetricCard label="Today profit" value={money(agent?.metrics.todayProfit ?? 0)} tone="success" trend="Agent profit" />
        <OpsMetricCard label="Authorized channels" value={String(agent?.metrics.authorizedChannelCount ?? 0)} tone="warn" trend="Available" />
      </section>

      {agent ? (
        <div className="mt-8">
          <AgentChannelAuthorization agentId={agent.id} channels={channels} agentChannels={agent.agentChannels} />
        </div>
      ) : null}

      <section className="mt-8">
        <SectionHeader title="Merchants under this agent" text="Open a merchant detail page for monitoring, wallet and emergency channel actions." />
        <DataTable columns={["Merchant", "Email", "Status", "Action"]} rows={merchantRows} empty="No merchants under this agent." />
      </section>
    </DashboardShell>
  );
}
