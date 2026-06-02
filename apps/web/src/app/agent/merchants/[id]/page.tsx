import { AgentMerchantChannelManager } from "@/components/AgentMerchantChannelManager";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = {
  merchant: {
    id: string;
    name: string;
    email?: string | null;
    status: string;
    wallet?: { availableBalance?: string; rollingReserveBalance?: string; currency?: string } | null;
    orders?: { amount: string; status: string; agentProfitAmount?: string }[];
    merchantChannels: {
      channelId: string;
      isEnabled: boolean;
      isPrimary: boolean;
      isBackup: boolean;
      merchantFeeRate: string;
      merchantFixedFee: string;
      channel: { id: string; name: string; paymentMethod: string; currency: string };
    }[];
  };
  agentChannels: {
    channelId: string;
    agentFeeRate: string;
    agentFixedFee: string;
    channel: { id: string; name: string; paymentMethod: string; currency: string; rollingReserveRate?: string; rollingReserveDays?: number };
  }[];
};

export default async function AgentMerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await apiGet<Payload | null>(`/api/agent/merchants/${id}`, null);
  const merchant = payload?.merchant;
  const currency = merchant?.wallet?.currency ?? "USD";
  const paidOrders = merchant?.orders?.filter((order) => order.status === "PAID") ?? [];
  const volume = paidOrders.reduce((sum, order) => sum + Number(order.amount), 0);
  const profit = paidOrders.reduce((sum, order) => sum + Number(order.agentProfitAmount ?? 0), 0);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Merchant Detail" role="Agent Admin">
      <SectionHeader
        eyebrow="Merchant operations"
        title={merchant?.name ?? "Merchant detail"}
        text="Open and manage merchant channels from this detail page only."
        status={merchant?.status ?? "UNKNOWN"}
      />
      <section className="grid-fit">
        <OpsMetricCard label="Status" value={merchant?.status ?? "-"} tone={merchant?.status === "ACTIVE" ? "success" : "warn"} trend="Merchant" />
        <OpsMetricCard label="Paid volume" value={money(volume, currency)} tone="brand" trend="Orders" />
        <OpsMetricCard label="Agent profit" value={money(profit, currency)} tone="success" trend="Margin" />
        <OpsMetricCard label="Available balance" value={money(merchant?.wallet?.availableBalance ?? 0, currency)} tone="cyan" trend="Wallet" />
        <OpsMetricCard label="Rolling reserve" value={money(merchant?.wallet?.rollingReserveBalance ?? 0, currency)} tone="warn" trend="Held" />
      </section>
      {merchant ? (
        <div className="mt-8">
          <AgentMerchantChannelManager merchantId={merchant.id} agentChannels={payload?.agentChannels ?? []} merchantChannels={merchant.merchantChannels ?? []} />
        </div>
      ) : null}
      <section className="mt-8 surface p-5">
        <h2 className="text-xl font-black text-slate-950">Current channel status</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(merchant?.merchantChannels ?? []).map((item) => (
            <div key={item.channelId} className="rounded-lg border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{item.channel.name}</p>
                  <p className="text-sm text-muted">{item.channel.paymentMethod} / {item.channel.currency}</p>
                </div>
                <StatusBadge status={item.isEnabled ? "ACTIVE" : "DISABLED"} />
              </div>
              <p className="mt-3 text-sm text-slate-700">Merchant fee {(Number(item.merchantFeeRate) * 100).toFixed(2)}% + {money(item.merchantFixedFee, item.channel.currency)}</p>
              <p className="mt-1 text-xs text-muted">{item.isPrimary ? "Primary channel" : item.isBackup ? "Backup channel" : "Normal channel"}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
