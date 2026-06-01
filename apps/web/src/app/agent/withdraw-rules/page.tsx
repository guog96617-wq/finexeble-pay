import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { WithdrawRuleForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = {
  merchants: {
    id: string;
    name: string;
  }[];
};

export default async function AgentWithdrawRulesPage() {
  const payload = await apiGet<Payload>("/api/agent/merchant-fees", { merchants: [] });

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Merchant Withdraw Rules" role="Agent Admin">
      <SectionHeader
        eyebrow="商户运营"
        title="商户提现规则"
        text="为名下商户配置提现金额范围、手续费和人工审核要求。"
        status="ACTIVE"
      />
      <section className="grid gap-4">
        {payload.merchants.map((merchant) => (
          <div key={merchant.id} className="surface p-5">
            <h2 className="text-lg font-black text-slate-950">{merchant.name}</h2>
            <p className="mt-1 text-sm text-muted">请确保提现费率不低于平台给你的最低提现费率。</p>
            <div className="mt-4">
              <WithdrawRuleForm merchantId={merchant.id} agent />
            </div>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
