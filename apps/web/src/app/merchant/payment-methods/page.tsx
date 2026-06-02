import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = {
  channels: {
    id: string;
    isPrimary: boolean;
    isBackup: boolean;
    isEnabled: boolean;
    merchantFeeRate: string;
    merchantFixedFee: string;
    channel: {
      name: string;
      paymentMethod: string;
      country?: string | null;
      currency: string;
      status: string;
      rollingReserveRate?: string;
      rollingReserveDays?: number;
    };
  }[];
};

function rate(value?: string) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

export default async function MerchantPaymentMethodsPage() {
  const payload = await apiGet<Payload>("/api/merchant/payment-methods", { channels: [] });
  const primary = payload.channels.find((item) => item.isPrimary);
  const backup = payload.channels.find((item) => item.isBackup);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="My Payment Channels" role="Merchant Admin">
      <SectionHeader
        eyebrow="Payment channels"
        title="My payment channels"
        text="Only channels opened for your merchant are shown here. Supplier, platform cost and agent margin are not exposed in the merchant console."
        status="ACTIVE"
      />

      <section className="grid-fit">
        <OpsMetricCard label="Opened channels" value={String(payload.channels.length)} tone="brand" trend="Enabled" />
        <OpsMetricCard label="Primary channel" value={primary?.channel.name ?? "Not set"} tone="success" trend="Primary" />
        <OpsMetricCard label="Backup channel" value={backup?.channel.name ?? "Not set"} tone="cyan" trend="Backup" />
      </section>

      <section className="mt-8 grid gap-4">
        {payload.channels.length === 0 ? (
          <div className="surface p-5">
            <h3 className="font-black text-slate-950">No payment channels opened</h3>
            <p className="mt-2 text-sm text-muted">Contact your agent if you need additional payment channels.</p>
          </div>
        ) : null}

        {payload.channels.map((item) => (
          <article key={item.id} className="surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-950">{item.channel.name}</h2>
                <p className="mt-1 text-sm text-muted">{item.channel.paymentMethod} / {item.channel.country ?? "GLOBAL"} / {item.channel.currency}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={item.isEnabled && item.channel.status === "ACTIVE" ? "ACTIVE" : "DISABLED"} />
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand">
                  {item.isPrimary ? "Primary" : item.isBackup ? "Backup" : "Available"}
                </span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
              <p><b>My fee:</b> {rate(item.merchantFeeRate)} + {money(item.merchantFixedFee, item.channel.currency)}</p>
              <p><b>Rolling reserve:</b> {rate(item.channel.rollingReserveRate)} / {item.channel.rollingReserveDays ?? 0} days</p>
              <p><b>Settlement:</b> Available balance receives net amount after fee and reserve hold.</p>
            </div>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}
