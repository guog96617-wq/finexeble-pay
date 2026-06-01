import { DashboardShell } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ChannelRoleButtons, CreateChannelForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Supplier = { id: string; name: string };
type Channel = { id: string; name: string; paymentMethod: string; country?: string | null; currency: string; feeRate?: string; status: string; isPrimary: boolean; isBackup: boolean; supplier?: Supplier };

export default async function AdminChannelsPage() {
  const [suppliers, channels] = await Promise.all([
    apiGet<Supplier[]>("/api/admin/suppliers", []),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);
  const rows = channels.map((channel) => [
    channel.name,
    channel.supplier?.name ?? "-",
    channel.paymentMethod,
    channel.country ?? "-",
    channel.currency,
    `${Number(channel.feeRate ?? 0) * 100}%`,
    <StatusBadge key={`${channel.id}-status`} status={channel.status} />,
    channel.isPrimary ? "是" : "-",
    channel.isBackup ? "是" : "-",
    <ChannelRoleButtons key={`${channel.id}-actions`} id={channel.id} />,
  ]);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="支付通道管理" role="Super Admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-950">支付通道管理</h2>
          <p className="mt-2 text-sm text-muted">管理每个 PSP 下的支付方式与主备通道。</p>
        </div>
        <Link href="#create-channel" className="button">新增通道</Link>
      </div>
      <section className="grid gap-6 xl:grid-cols-[.78fr_1.22fr]">
        <CreateChannelForm suppliers={suppliers} />
        <div>
          <DataTable columns={["通道名称", "所属 PSP", "支付方式", "国家/地区", "币种", "成本费率", "状态", "主通道", "备用通道", "操作"]} rows={rows} empty="还没有支付通道，请先点击新增通道。" />
        </div>
      </section>
    </DashboardShell>
  );
}
