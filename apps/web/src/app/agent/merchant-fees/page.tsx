import { DashboardShell } from "@/components/DashboardShell";
import { MerchantChannelForm } from "@/components/V15Forms";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = {
  rule?: { minMerchantFeeRate: string; minWithdrawFeeRate: string } | null;
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
  const minMerchantRate = Number(payload.rule?.minMerchantFeeRate ?? 0);
  const minWithdrawRate = Number(payload.rule?.minWithdrawFeeRate ?? 0);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Merchant Fee Settings" role="Agent Admin">
      <SectionHeader
        eyebrow="Merchant Operations"
        title="商户费率设置"
        text="该页面只负责费率配置。代理设置商户费率时，不可低于平台下发的最低费率。"
        status="ACTIVE"
      />

      <section className="mb-6 grid-fit">
        <OpsMetricCard label="平台最低商户费率" value={`${(minMerchantRate * 100).toFixed(2)}%`} tone="brand" trend="Floor" />
        <OpsMetricCard label="平台最低提现费率" value={`${(minWithdrawRate * 100).toFixed(2)}%`} tone="warn" trend="Floor" />
        <OpsMetricCard label="示例利润空间" value={`${Math.max(0, 0.12 - minMerchantRate).toFixed(4)} (${((Math.max(0, 0.12 - minMerchantRate)) * 100).toFixed(2)}%)`} tone="success" trend="Example" />
      </section>

      <section className="surface mb-6 p-4 text-sm text-slate-700">
        <p>示例：平台最低费率 10%，你给商户设置 10% 或 12% 可以，设置 9% 会失败。</p>
      </section>

      <section className="grid gap-4">
        {payload.merchants.map((merchant) => (
          <div key={merchant.id} className="surface p-4">
            <h2 className="text-lg font-black text-slate-950">{merchant.name}</h2>
            <p className="mt-1 text-sm text-muted">请在每个通道上配置商户费率，系统会自动校验最低费率。</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {merchant.merchantChannels?.map((item) => (
                <div key={item.channelId} className="rounded-xl border border-line p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-900">{item.channel.name}</p>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-brand">
                      利润空间 {((Math.max(0, Number(item.merchantFeeRate ?? 0.12) - minMerchantRate)) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted">当前费率：{(Number(item.merchantFeeRate ?? 0.12) * 100).toFixed(2)}%</p>
                  <MerchantChannelForm merchantId={merchant.id} channelId={item.channelId} agent />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
