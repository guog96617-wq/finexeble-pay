import { DashboardShell } from "@/components/DashboardShell";
import { DataTable } from "@/components/DataTable";
import { ListToolbar, SectionHeader } from "@/components/ProductOps";
import { WithdrawRuleForm } from "@/components/V15Forms";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Rule = { id: string; currency: string; minAmount: string; maxAmount: string; withdrawFeeRate: string; withdrawFixedFee: string; merchant?: { name: string } | null; agent?: { name: string } | null };

export default async function AdminWithdrawRulesPage() {
  const rules = await apiGet<Rule[]>("/api/admin/withdraw-rules", []);
  const rows = rules.map((rule) => [
    rule.merchant?.name ?? rule.agent?.name ?? "全局规则",
    rule.currency,
    money(rule.minAmount, rule.currency),
    money(rule.maxAmount, rule.currency),
    `${Number(rule.withdrawFeeRate) * 100}% + ${money(rule.withdrawFixedFee, rule.currency)}`,
  ]);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="提现规则" role="Super Admin">
      <SectionHeader
        eyebrow="资金与结算"
        title="提现规则"
        text="配置平台、代理或商户的提现金额范围、手续费和审核规则。"
        status="ACTIVE"
      />
      <ListToolbar searchPlaceholder="搜索商户、代理或币种" statusLabel="全部规则状态" />
      <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <WithdrawRuleForm />
        <div>
          <DataTable columns={["适用对象", "币种", "最低提现", "最高提现", "手续费"]} rows={rows} empty="还没有提现规则，请先创建一条规则。" />
        </div>
      </section>
    </DashboardShell>
  );
}
