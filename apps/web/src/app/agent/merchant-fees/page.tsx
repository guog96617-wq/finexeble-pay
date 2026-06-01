import { DashboardShell } from "@/components/DashboardShell";
import { MerchantChannelForm, WithdrawRuleForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = { rule?: { minMerchantFeeRate: string; minWithdrawFeeRate: string } | null; merchants: { id: string; name: string; merchantChannels?: { channelId: string; channel: { name: string } }[] }[] };

export default async function AgentMerchantFeesPage() {
  const payload = await apiGet<Payload>("/api/agent/merchant-fees", { merchants: [] });
  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Merchant Fee Control" role="Agent Admin">
      <div className="mb-4 surface p-4 text-sm text-muted">
        Minimum merchant fee: {Number(payload.rule?.minMerchantFeeRate ?? 0) * 100}% / Minimum withdraw fee: {Number(payload.rule?.minWithdrawFeeRate ?? 0) * 100}%
      </div>
      <div className="grid gap-4">
        {payload.merchants.map((merchant) => (
          <section key={merchant.id} className="surface grid gap-4 p-4">
            <h2 className="font-black text-slate-950">{merchant.name}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {merchant.merchantChannels?.map((item) => (
                <div key={item.channelId} className="rounded-xl border border-line p-3">
                  <p className="font-bold">{item.channel.name}</p>
                  <MerchantChannelForm merchantId={merchant.id} channelId={item.channelId} agent />
                </div>
              ))}
            </div>
            <WithdrawRuleForm merchantId={merchant.id} agent />
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
