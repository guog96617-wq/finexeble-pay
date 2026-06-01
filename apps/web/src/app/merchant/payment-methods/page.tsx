import { DashboardShell } from "@/components/DashboardShell";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = { channels: { id: string; isPrimary: boolean; isBackup: boolean; merchantFeeRate: string; merchantFixedFee: string; channel: { name: string; paymentMethod: string; supplier?: { name: string } } }[]; withdrawRule?: { minAmount: string; maxAmount: string; withdrawFeeRate: string; withdrawFixedFee: string; currency: string } };

export default async function MerchantPaymentMethodsPage() {
  const payload = await apiGet<Payload>("/api/merchant/payment-methods", { channels: [] });
  const primary = payload.channels.find((item) => item.isPrimary);
  const backup = payload.channels.find((item) => item.isBackup);
  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="我的支付方式" role="Merchant Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-950">我的支付方式</h2>
        <p className="mt-2 text-sm text-muted">查看已开通的支付方式、当前主备通道、手续费和提现规则。</p>
      </div>
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">已开通支付方式</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{payload.channels.length}</h3>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">当前主通道</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{primary?.channel.name ?? "未设置"}</h3>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-bold text-muted">当前备用通道</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{backup?.channel.name ?? "未设置"}</h3>
        </div>
      </section>
      <section className="grid gap-4">
        {payload.channels.length === 0 ? (
          <div className="surface p-5">
            <h3 className="font-black text-slate-950">暂未开通支付方式</h3>
            <p className="mt-2 text-sm text-muted">如果需要开通更多支付方式，请联系平台或代理商。</p>
          </div>
        ) : null}
        {payload.channels.map((item) => (
          <div key={item.id} className="surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-950">{item.channel.name}</h2>
                <p className="mt-1 text-sm text-muted">{item.channel.supplier?.name} / {item.channel.paymentMethod}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand">{item.isPrimary ? "主通道" : item.isBackup ? "备用通道" : "已启用"}</span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              <p>我的手续费：{Number(item.merchantFeeRate) * 100}% + {money(item.merchantFixedFee)}</p>
              <p>支付方式：{item.channel.paymentMethod}</p>
              <p>通道角色：{item.isPrimary ? "主通道" : item.isBackup ? "备用通道" : "普通可用通道"}</p>
            </div>
          </div>
        ))}
        {payload.withdrawRule ? (
          <div id="withdraw-rule" className="surface p-5">
            <h2 className="font-black text-slate-950">我的提现规则</h2>
            <p className="mt-2 text-sm text-slate-700">提现范围：{money(payload.withdrawRule.minAmount, payload.withdrawRule.currency)} - {money(payload.withdrawRule.maxAmount, payload.withdrawRule.currency)}</p>
            <p className="mt-1 text-sm text-slate-700">提现手续费：{Number(payload.withdrawRule.withdrawFeeRate) * 100}% + {money(payload.withdrawRule.withdrawFixedFee, payload.withdrawRule.currency)}</p>
          </div>
        ) : null}
        <div id="checkout-help" className="surface p-5">
          <h2 className="font-black text-slate-950">Checkout 支付链接说明</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">商户创建订单后，系统会自动生成 Checkout 支付链接。你可以在订单列表打开链接，给客户完成 Sandbox 支付测试。</p>
          <p className="mt-2 text-sm text-muted">如果需要开通更多支付方式，请联系平台或代理商。</p>
        </div>
      </section>
    </DashboardShell>
  );
}
