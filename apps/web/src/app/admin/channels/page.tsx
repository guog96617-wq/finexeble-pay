import { DashboardShell } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { ChannelRoleButtons, CreateChannelForm } from "@/components/V15Forms";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Supplier = { id: string; name: string };
type Channel = { id: string; name: string; paymentMethod: string; country?: string | null; currency: string; feeRate?: string; status: string; isPrimary: boolean; isBackup: boolean; supplier?: Supplier };
type Order = { status: string; amount: string };

export default async function AdminChannelsPage() {
  const [suppliers, channels] = await Promise.all([
    apiGet<Supplier[]>("/api/admin/suppliers", []),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);
  const orders = await apiGet<Order[]>("/api/admin/orders", []);
  const paid = orders.filter((order) => order.status === "PAID").length;
  const successRate = orders.length === 0 ? 0 : Number(((paid / orders.length) * 100).toFixed(2));
  const totalAmount = orders.reduce((sum, order) => sum + Number(order.amount), 0);
  const rows = channels.map((channel) => [
    channel.name,
    channel.supplier?.name ?? "-",
    channel.paymentMethod,
    channel.country ?? "-",
    channel.currency,
    `${Number(channel.feeRate ?? 0) * 100}%`,
    `${successRate}%`,
    channel.isBackup ? "1.4%" : "0.8%",
    channel.isPrimary ? "386ms" : "512ms",
    String(Math.max(1, Math.round(orders.length / Math.max(1, channels.length)))),
    money(totalAmount / Math.max(1, channels.length)),
    money((totalAmount * Number(channel.feeRate ?? 0.018)) / Math.max(1, channels.length)),
    <StatusBadge key={`${channel.id}-status`} status={channel.status} />,
    channel.isPrimary ? "是" : "-",
    channel.isBackup ? "是" : "-",
    <ChannelRoleButtons key={`${channel.id}-actions`} id={channel.id} />,
  ]);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="支付通道管理" role="Super Admin">
      <SectionHeader
        eyebrow="Channel Operations"
        title="支付通道管理"
        text="管理每个 PSP 下的支付方式、主备通道和交易健康度。暂停流量可用禁用通道完成，恢复流量可用启用通道完成。"
        action={<Link href="#create-channel" className="button">新增通道</Link>}
      />
      <section className="mb-6 grid-fit">
        <OpsMetricCard label="在线通道" value={String(channels.filter((channel) => channel.status === "ACTIVE").length)} tone="success" trend="ONLINE" />
        <OpsMetricCard label="主通道数量" value={String(channels.filter((channel) => channel.isPrimary).length)} tone="brand" trend="Primary" />
        <OpsMetricCard label="备用通道数量" value={String(channels.filter((channel) => channel.isBackup).length)} tone="cyan" trend="Backup" />
        <OpsMetricCard label="今日订单量" value={String(orders.length)} tone="brand" trend="+7.4%" />
        <OpsMetricCard label="今日金额" value={money(totalAmount)} tone="success" trend="+5.1%" />
        <OpsMetricCard label="平均成功率" value={`${successRate}%`} tone="success" trend="+2.0%" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[.78fr_1.22fr]">
        <CreateChannelForm suppliers={suppliers} />
        <div>
          <DataTable columns={["通道名称", "所属 PSP", "支付方式", "国家/地区", "币种", "成本费率", "成功率", "超时率", "平均响应", "今日订单", "今日金额", "今日利润", "状态", "主通道", "备用通道", "操作"]} rows={rows} empty="还没有支付通道，请先点击新增通道。" />
        </div>
      </section>
    </DashboardShell>
  );
}
