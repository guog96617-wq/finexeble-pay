import { DashboardShell } from "@/components/DashboardShell";
import { MerchantChannelForm, WithdrawRuleForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = { rule?: { minMerchantFeeRate: string; minWithdrawFeeRate: string } | null; merchants: { id: string; name: string; merchantChannels?: { channelId: string; merchantFeeRate?: string; channel: { name: string } }[] }[] };

export default async function AgentMerchantFeesPage() {
  const payload = await apiGet<Payload>("/api/agent/merchant-fees", { merchants: [] });
  const minMerchantRate = Number(payload.rule?.minMerchantFeeRate ?? 0);
  const minWithdrawRate = Number(payload.rule?.minWithdrawFeeRate ?? 0);
  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="商户费率设置" role="Agent Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-950">商户费率设置</h2>
        <p className="mt-2 text-sm text-muted">这里显示平台给你的最低费率、你给商户设置的费率，以及你的利润空间。</p>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">平台给我的最低费率</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{minMerchantRate * 100}%</h3>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">最低提现费率</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{minWithdrawRate * 100}%</h3>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">示例利润</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">2%</h3>
          <p className="mt-2 text-sm text-muted">平台最低 10%，商户费率 12%，我的利润 2%。</p>
        </div>
      </div>
      <div className="grid gap-4">
        {payload.merchants.map((merchant) => (
          <section key={merchant.id} className="surface grid gap-4 p-4">
            <h2 className="font-black text-slate-950">{merchant.name}</h2>
            <p className="text-sm text-muted">不能低于平台给你的最低费率。低于最低费率时，系统会提示重新设置。</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {merchant.merchantChannels?.map((item) => (
                <div key={item.channelId} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-bold">{item.channel.name}</p>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-brand">
                      利润空间 {Math.max(0, Number(item.merchantFeeRate ?? 0.12) - minMerchantRate) * 100}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">当前商户费率：{Number(item.merchantFeeRate ?? 0.12) * 100}%</p>
                  <MerchantChannelForm merchantId={merchant.id} channelId={item.channelId} agent />
                </div>
              ))}
            </div>
            <div id="withdraw-rules">
              <WithdrawRuleForm merchantId={merchant.id} agent />
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
