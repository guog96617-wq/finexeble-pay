import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, OpsMetricCard, SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Merchant = {
  id: string;
  name: string;
  status: string;
  wallet?: { balance: string; availableBalance: string; frozenBalance: string; currency: string } | null;
};

export default async function AdminWalletPage() {
  const merchants = await apiGet<Merchant[]>("/api/admin/merchants", []);
  const totalBalance = merchants.reduce((sum, merchant) => sum + Number(merchant.wallet?.balance ?? 0), 0);
  const availableBalance = merchants.reduce((sum, merchant) => sum + Number(merchant.wallet?.availableBalance ?? 0), 0);
  const frozenBalance = merchants.reduce((sum, merchant) => sum + Number(merchant.wallet?.frozenBalance ?? 0), 0);
  const rows = merchants.map((merchant) => {
    const currency = merchant.wallet?.currency ?? "USD";
    return [
      merchant.name,
      <StatusBadge key={`${merchant.id}-status`} status={merchant.status} />,
      money(merchant.wallet?.balance, currency),
      money(merchant.wallet?.availableBalance, currency),
      money(merchant.wallet?.frozenBalance, currency),
      <Link key={`${merchant.id}-link`} className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}#wallet`}>
        查看商户钱包
      </Link>,
    ];
  });

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="钱包流水" role="Super Admin">
      <SectionHeader
        eyebrow="资金与结算"
        title="钱包流水"
        text="集中查看商户钱包余额、可提现余额和冻结余额。单个商户的订单、钱包与提现明细进入 Merchant 360 查看。"
        status="ACTIVE"
      />
      <section className="grid-fit">
        <OpsMetricCard label="总余额" value={money(totalBalance)} tone="brand" trend="Balance" />
        <OpsMetricCard label="可提现余额" value={money(availableBalance)} tone="success" trend="Available" />
        <OpsMetricCard label="冻结金额" value={money(frozenBalance)} tone="warn" trend="Frozen" />
        <OpsMetricCard label="商户钱包数" value={String(merchants.filter((merchant) => merchant.wallet).length)} tone="cyan" trend="Wallets" />
      </section>
      <section className="mt-8">
        <ListToolbar searchPlaceholder="搜索商户或钱包状态" statusLabel="全部商户状态" />
        <DataTable columns={["商户", "状态", "总余额", "可提现余额", "冻结余额", "操作"]} rows={rows} empty="暂无钱包数据。" />
      </section>
    </DashboardShell>
  );
}
