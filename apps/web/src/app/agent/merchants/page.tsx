import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Merchant = {
  id: string;
  name: string;
  status: string;
  wallet?: { availableBalance?: string; currency?: string } | null;
};

export default async function AgentMerchantsPage() {
  const merchants = await apiGet<Merchant[]>("/api/agent/merchants", []);
  const rows = merchants.map((merchant) => [
    merchant.name,
    <StatusBadge key={`${merchant.id}-status`} status={merchant.status} />,
    money(merchant.wallet?.availableBalance ?? 0, merchant.wallet?.currency ?? "USD"),
    <div key={`${merchant.id}-actions`} className="flex gap-2">
      <a href="/agent/payment-methods" className="button secondary px-3 py-2 text-xs">管理 PSP</a>
      <a href="/agent/merchant-fees" className="button secondary px-3 py-2 text-xs">管理费率</a>
    </div>,
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="My Merchants" role="Agent Admin">
      <SectionHeader
        eyebrow="Merchant Operations"
        title="我的商户"
        text="该页面只负责查看与进入商户运营动作。"
        status="ACTIVE"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <SearchInput placeholder="搜索商户名称" />
        <select defaultValue="ALL" aria-label="商户状态筛选">
          <option value="ALL">全部状态</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PENDING">PENDING</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>
      <DataTable
        columns={["商户名称", "状态", "可提现余额", "操作"]}
        rows={rows}
        empty="暂无商户。"
      />
    </DashboardShell>
  );
}
