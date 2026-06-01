import { DashboardShell } from "@/components/DashboardShell";
import { WithdrawRuleForm } from "@/components/V15Forms";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Rule = { id: string; currency: string; minAmount: string; maxAmount: string; withdrawFeeRate: string; withdrawFixedFee: string; merchant?: { name: string } | null; agent?: { name: string } | null };

export default async function AdminWithdrawRulesPage() {
  const rules = await apiGet<Rule[]>("/api/admin/withdraw-rules", []);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Withdraw Rules" role="Super Admin">
      <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <WithdrawRuleForm />
        <div className="surface overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Scope</th><th>Currency</th><th>Min</th><th>Max</th><th>Fee</th></tr></thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-t border-line">
                  <td className="p-3">{rule.merchant?.name ?? rule.agent?.name ?? "Global"}</td>
                  <td>{rule.currency}</td>
                  <td>{money(rule.minAmount, rule.currency)}</td>
                  <td>{money(rule.maxAmount, rule.currency)}</td>
                  <td>{Number(rule.withdrawFeeRate) * 100}% + {money(rule.withdrawFixedFee, rule.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
