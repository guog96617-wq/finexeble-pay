import { DashboardShell } from "@/components/DashboardShell";
import { MerchantChannelForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type MerchantGroup = { id: string; name: string; merchantChannels?: { channelId: string; channel: { name: string; paymentMethod: string; supplier?: { name: string } } }[] };

export default async function AgentPaymentMethodsPage() {
  const groups = await apiGet<MerchantGroup[]>("/api/agent/payment-methods", []);
  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Merchant Payment Methods" role="Agent Admin">
      <div className="grid gap-4">
        {groups.map((merchant) => (
          <section key={merchant.id} className="surface p-4">
            <h2 className="font-black text-slate-950">{merchant.name}</h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {merchant.merchantChannels?.map((item) => (
                <div key={item.channelId} className="rounded-xl border border-line p-3">
                  <p className="font-bold">{item.channel.name}</p>
                  <p className="text-sm text-muted">{item.channel.paymentMethod}</p>
                  <MerchantChannelForm merchantId={merchant.id} channelId={item.channelId} agent />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
