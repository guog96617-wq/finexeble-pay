import { DashboardShell } from "@/components/DashboardShell";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = { channels: { id: string; isPrimary: boolean; isBackup: boolean; merchantFeeRate: string; merchantFixedFee: string; channel: { name: string; paymentMethod: string; supplier?: { name: string } } }[]; withdrawRule?: { minAmount: string; maxAmount: string; withdrawFeeRate: string; withdrawFixedFee: string; currency: string } };

export default async function MerchantPaymentMethodsPage() {
  const payload = await apiGet<Payload>("/api/merchant/payment-methods", { channels: [] });
  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Payment Methods" role="Merchant Admin">
      <section className="grid gap-4">
        {payload.channels.map((item) => (
          <div key={item.id} className="surface p-4">
            <h2 className="font-black text-slate-950">{item.channel.name}</h2>
            <p className="mt-1 text-sm text-muted">{item.channel.supplier?.name} / {item.channel.paymentMethod} / {item.isPrimary ? "Primary" : item.isBackup ? "Backup" : "Enabled"}</p>
            <p className="mt-2 text-sm text-slate-700">Merchant fee: {Number(item.merchantFeeRate) * 100}% + {money(item.merchantFixedFee)}</p>
          </div>
        ))}
        {payload.withdrawRule ? (
          <div className="surface p-4">
            <h2 className="font-black text-slate-950">Withdraw Rule</h2>
            <p className="mt-2 text-sm text-slate-700">Range: {money(payload.withdrawRule.minAmount, payload.withdrawRule.currency)} - {money(payload.withdrawRule.maxAmount, payload.withdrawRule.currency)}</p>
            <p className="mt-1 text-sm text-slate-700">Fee: {Number(payload.withdrawRule.withdrawFeeRate) * 100}% + {money(payload.withdrawRule.withdrawFixedFee, payload.withdrawRule.currency)}</p>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}
