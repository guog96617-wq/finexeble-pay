import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { InsightCard, OpsMetricCard, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Agent = {
  id: string;
  name: string;
  email?: string | null;
  contactName?: string | null;
  status: string;
  commissionRate?: string | null;
  merchants?: { id: string; name: string; status: string; email?: string | null }[];
};

type FeeRule = {
  agentId: string;
  minMerchantFeeRate: string;
  minWithdrawFeeRate: string;
  allowedPaymentMethods?: string[];
  allowedChannelIds?: string[];
};

export default async function AdminAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [agents, feeRules] = await Promise.all([
    apiGet<Agent[]>("/api/admin/agents", []),
    apiGet<FeeRule[]>("/api/admin/agent-fee-rules", []),
  ]);
  const agent = agents.find((item) => item.id === id) ?? null;
  const rule = feeRules.find((item) => item.agentId === id) ?? null;
  const merchantRows = (agent?.merchants ?? []).map((merchant) => [
    merchant.name,
    merchant.email ?? "-",
    <StatusBadge key={`${merchant.id}-status`} status={merchant.status} />,
    <Link key={`${merchant.id}-link`} className="button secondary px-3 py-2 text-xs" href={`/admin/merchants/${merchant.id}`}>
      进入 Merchant 360
    </Link>,
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="代理详情" role="Super Admin">
      <SectionHeader
        eyebrow="代理体系"
        title={agent?.name ?? "代理详情"}
        text="代理详情页负责最低费率、PSP 权限、代理利润和名下商户。代理列表页只保留查看入口。"
        status={agent?.status ?? "UNKNOWN"}
        action={<Link className="button" href={`/admin/agents/${id}/fee-rules`}>设置费率权限</Link>}
      />

      <section className="grid-fit">
        <OpsMetricCard label="代理状态" value={agent?.status ?? "-"} tone={agent?.status === "ACTIVE" ? "success" : "warn"} trend="Status" />
        <OpsMetricCard label="名下商户" value={String(agent?.merchants?.length ?? 0)} tone="brand" trend="Merchants" />
        <OpsMetricCard label="默认佣金" value={agent?.commissionRate ? `${Number(agent.commissionRate) * 100}%` : "-"} tone="cyan" trend="Commission" />
        <OpsMetricCard label="最低商户费率" value={rule ? `${Number(rule.minMerchantFeeRate) * 100}%` : "未配置"} tone="warn" trend="Guardrail" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <InsightCard title="代理费率规则" text="平台给代理设置最低费率。代理给商户设置费率时，不能低于这里的费率。">
          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
            <p>最低商户费率：{rule ? `${Number(rule.minMerchantFeeRate) * 100}%` : "未配置"}</p>
            <p>最低提现费率：{rule ? `${Number(rule.minWithdrawFeeRate) * 100}%` : "未配置"}</p>
            <p>可管理支付方式：{rule?.allowedPaymentMethods?.join(" / ") || "默认跟随平台"}</p>
          </div>
        </InsightCard>
        <InsightCard title="代理利润观察" text="这里展示代理运营视角，不在详情页直接处理支付底层逻辑。">
          <SimpleBars labels={["商户费率", "平台最低费率", "代理利润", "活跃商户", "订单贡献"]} />
        </InsightCard>
      </section>

      <section className="mt-8">
        <SectionHeader title="名下商户" text="查看该代理名下商户，并进入 Merchant 360 处理商户级 PSP、费率、提现规则、钱包和订单。" />
        <DataTable columns={["商户", "邮箱", "状态", "操作"]} rows={merchantRows} empty="该代理暂时没有名下商户。" />
      </section>
    </DashboardShell>
  );
}
