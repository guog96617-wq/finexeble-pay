import { AdminMerchantChannelActions } from "@/components/AdminMerchantChannelActions";
import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Merchant = {
  id: string;
  name: string;
  status: string;
  email?: string | null;
  wallet?: { balance: string; availableBalance: string; frozenBalance: string; rollingReserveBalance: string; currency: string } | null;
  orders?: { orderNo: string; status: string; amount: string; currency: string; agentProfitAmount?: string; platformProfitAmount?: string; pspCostAmount?: string }[];
  merchantChannels?: {
    channelId: string;
    isEnabled: boolean;
    isPrimary: boolean;
    isBackup: boolean;
    merchantFeeRate: string;
    merchantFixedFee: string;
    channel: { name: string; paymentMethod: string; currency: string; status: string; pspCostRate?: string; rollingReserveRate?: string; rollingReserveDays?: number };
  }[];
};

function rate(value?: string) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

export default async function AdminMerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const merchant = await apiGet<Merchant | null>(`/api/admin/merchants/${id}`, null);
  const currency = merchant?.wallet?.currency ?? "USD";
  const paidOrders = merchant?.orders?.filter((order) => order.status === "PAID") ?? [];
  const volume = paidOrders.reduce((sum, order) => sum + Number(order.amount), 0);
  const platformProfit = paidOrders.reduce((sum, order) => sum + Number(order.platformProfitAmount ?? 0), 0);
  const agentProfit = paidOrders.reduce((sum, order) => sum + Number(order.agentProfitAmount ?? 0), 0);
  const pspCost = paidOrders.reduce((sum, order) => sum + Number(order.pspCostAmount ?? 0), 0);

  const channelRows = (merchant?.merchantChannels ?? []).map((item) => [
    item.channel.name,
    item.channel.paymentMethod,
    <StatusBadge key={`${item.channelId}-status`} status={item.isEnabled && item.channel.status === "ACTIVE" ? "ACTIVE" : "DISABLED"} />,
    item.isPrimary ? "Primary" : item.isBackup ? "Backup" : "Normal",
    `${rate(item.merchantFeeRate)} + ${money(item.merchantFixedFee, item.channel.currency)}`,
    rate(item.channel.pspCostRate),
    `${rate(item.channel.rollingReserveRate)} / ${item.channel.rollingReserveDays ?? 0} days`,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Merchant Detail" role="Super Admin">
      <SectionHeader
        eyebrow="Merchant supervision"
        title={merchant?.name ?? "Merchant detail"}
        text="Admin can review wallet, rolling reserve, cost and profit, and can emergency disable or restore all merchant channels."
        status={merchant?.status ?? "UNKNOWN"}
        action={merchant ? <AdminMerchantChannelActions merchantId={merchant.id} /> : null}
      />
      <section className="grid-fit">
        <OpsMetricCard label="Status" value={merchant?.status ?? "-"} tone={merchant?.status === "ACTIVE" ? "success" : "warn"} trend="Merchant" />
        <OpsMetricCard label="Available balance" value={money(merchant?.wallet?.availableBalance ?? 0, currency)} tone="success" trend="Withdrawable" />
        <OpsMetricCard label="Frozen balance" value={money(merchant?.wallet?.frozenBalance ?? 0, currency)} tone="warn" trend="Frozen" />
        <OpsMetricCard label="Rolling reserve" value={money(merchant?.wallet?.rollingReserveBalance ?? 0, currency)} tone="cyan" trend="Held" />
        <OpsMetricCard label="Paid volume" value={money(volume, currency)} tone="brand" trend="Orders" />
        <OpsMetricCard label="Platform profit" value={money(platformProfit, currency)} tone="success" trend="Margin" />
        <OpsMetricCard label="Agent profit" value={money(agentProfit, currency)} tone="cyan" trend="Margin" />
        <OpsMetricCard label="PSP cost" value={money(pspCost, currency)} tone="warn" trend="Cost" />
      </section>
      <section className="mt-8">
        <SectionHeader title="Merchant channels" text="Channel authorization is managed by the agent. Admin can monitor and emergency pause or restore all merchant channels here." />
        <DataTable columns={["Channel", "Method", "Status", "Role", "Merchant fee", "PSP cost", "Reserve"]} rows={channelRows} empty="No channels opened for this merchant." />
      </section>
    </DashboardShell>
  );
}
