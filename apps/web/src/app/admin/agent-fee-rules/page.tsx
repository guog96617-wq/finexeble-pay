import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Rule = {
  agentId: string;
  minMerchantFeeRate: string;
  minWithdrawFeeRate: string;
  allowedPaymentMethods?: string[];
  allowedChannelIds?: string[];
  agent?: { id: string; name: string; status: string } | null;
};

export default async function AdminAgentFeeRulesListPage() {
  const rules = await apiGet<Rule[]>("/api/admin/agent-fee-rules", []);
  const rows = rules.map((rule) => [
    rule.agent?.name ?? rule.agentId,
    `${(Number(rule.minMerchantFeeRate) * 100).toFixed(2)}%`,
    `${(Number(rule.minWithdrawFeeRate) * 100).toFixed(2)}%`,
    rule.allowedPaymentMethods?.join(" / ") ?? "-",
    `${rule.allowedChannelIds?.length ?? 0}`,
    <Link key={`${rule.agentId}-edit`} className="button secondary px-3 py-2 text-xs" href={`/admin/agents/${rule.agentId}/fee-rules`}>
      设置费率权限
    </Link>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Agent Fee Rules" role="Super Admin">
      <SectionHeader
        eyebrow="代理体系"
        title="代理费率规则"
        text="集中查看平台代理最低费率、防穿透规则和通道授权范围。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索代理名称或授权范围" statusLabel="全部规则" />
      <DataTable
        columns={["代理", "最低商户费率", "最低提现费率", "支付方式权限", "可管理通道数", "操作"]}
        rows={rows}
        empty="暂无代理费率规则。"
      />
    </DashboardShell>
  );
}
