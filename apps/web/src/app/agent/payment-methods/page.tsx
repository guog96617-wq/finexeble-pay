import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type AgentChannel = {
  id: string;
  isEnabled: boolean;
  agentFeeRate: string;
  agentFixedFee: string;
  channel: {
    name: string;
    paymentMethod: string;
    country?: string | null;
    currency: string;
    status: string;
    pspCostRate?: string;
    rollingReserveRate?: string;
    rollingReserveDays?: number;
  };
};

function rate(value?: string) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

export default async function AgentPaymentMethodsPage() {
  const channels = await apiGet<AgentChannel[]>("/api/agent/payment-methods", []);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="My Available Channels" role="Agent Admin">
      <SectionHeader
        eyebrow="Channel operations"
        title="My available channels"
        text="These channels were authorized by the platform. Open merchant channels from a specific merchant detail page."
        status="ACTIVE"
      />
      <section className="grid-fit">
        <OpsMetricCard label="Authorized channels" value={String(channels.length)} tone="brand" trend="Available" />
        <OpsMetricCard label="Enabled channels" value={String(channels.filter((item) => item.isEnabled).length)} tone="success" trend="Usable" />
        <OpsMetricCard label="Disabled channels" value={String(channels.filter((item) => !item.isEnabled).length)} tone="warn" trend="Paused" />
      </section>
      <section className="mt-8 grid gap-4">
        {channels.map((item) => (
          <article key={item.id} className="surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-950">{item.channel.name}</h2>
                <p className="mt-1 text-sm text-muted">{item.channel.paymentMethod} / {item.channel.country ?? "GLOBAL"} / {item.channel.currency}</p>
              </div>
              <StatusBadge status={item.isEnabled && item.channel.status === "ACTIVE" ? "ACTIVE" : "DISABLED"} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              <p><b>My channel cost:</b> {rate(item.agentFeeRate)} + {money(item.agentFixedFee, item.channel.currency)}</p>
              <p><b>PSP cost:</b> {rate(item.channel.pspCostRate)}</p>
              <p><b>Rolling reserve:</b> {rate(item.channel.rollingReserveRate)} / {item.channel.rollingReserveDays ?? 0} days</p>
            </div>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}
