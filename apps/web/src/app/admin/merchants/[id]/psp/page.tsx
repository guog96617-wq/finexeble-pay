import { DashboardShell } from "@/components/DashboardShell";
import { MerchantChannelForm, WithdrawRuleForm } from "@/components/V15Forms";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Channel = { id: string; name: string; paymentMethod: string; currency: string; feeRate?: string; supplier?: { name: string } };
type Merchant = { id: string; name: string; merchantChannels?: { channelId: string; isEnabled: boolean; isPrimary: boolean; isBackup: boolean; merchantFeeRate?: string; merchantFixedFee?: string }[] };

export default async function AdminMerchantPspPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [merchant, channels] = await Promise.all([
    apiGet<Merchant | null>(`/api/admin/merchants/${id}/psp`, null),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="商户 PSP 与费率配置" role="Super Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-950">商户 PSP 与费率配置</h2>
        <p className="mt-2 text-sm text-muted">为 {merchant?.name ?? "该商户"} 开通支付通道，设置主备通道、商户费率和提现规则。</p>
      </div>
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">配置对象</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{merchant?.name ?? "Merchant"}</h3>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">已启用通道</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{merchant?.merchantChannels?.filter((item) => item.isEnabled).length ?? 0}</h3>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">说明</p>
          <p className="mt-2 text-sm text-slate-700">先启用通道，再选择主通道或备用通道。</p>
        </div>
      </section>
      <section id="merchant-fees" className="grid gap-4 lg:grid-cols-2">
        {channels.map((channel) => (
          <div key={channel.id} className="surface grid gap-3 p-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-black text-slate-900">{channel.name}</h3>
                <StatusBadge status={merchant?.merchantChannels?.find((item) => item.channelId === channel.id)?.isEnabled ? "ACTIVE" : "DISABLED"} />
              </div>
              <p className="mt-1 text-sm text-muted">{channel.supplier?.name} / {channel.paymentMethod} / {channel.currency}</p>
              <p className="mt-1 text-xs text-muted">PSP 成本费率：{Number(channel.feeRate ?? 0) * 100}%</p>
            </div>
            <MerchantChannelForm merchantId={id} channelId={channel.id} />
          </div>
        ))}
      </section>
      <section id="withdraw-rule" className="mt-8 grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
        <WithdrawRuleForm merchantId={id} />
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">费用计算说明</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <p>订单金额：{money(100)}</p>
            <p>商户手续费：订单金额 x 商户百分比手续费 + 商户固定手续费。</p>
            <p>商户入账：订单金额 - 商户手续费。</p>
            <p>平台利润：商户手续费 - PSP 成本 - 代理佣金。</p>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
