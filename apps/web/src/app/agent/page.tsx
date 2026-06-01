import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { SearchInput } from "@/components/SearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Dashboard = {
  merchantCount: number;
  todayVolume: string;
  totalVolume: string;
  commissionIncome: string;
};

type Merchant = {
  id?: string;
  name: string;
  status: string;
  wallet?: { availableBalance: string; currency: string } | null;
  merchantChannels?: { merchantFeeRate?: string; channel?: { name: string; supplier?: { name: string } } }[];
};

type Commission = {
  orderNo: string;
  amount: string;
  commissionRate: string;
  commissionAmount: number;
};

export default async function AgentPage() {
  const [dashboard, merchants, commissions, feePayload] = await Promise.all([
    apiGet<Dashboard>("/api/agent/dashboard", { merchantCount: 0, todayVolume: "0", totalVolume: "0", commissionIncome: "0" }),
    apiGet<Merchant[]>("/api/agent/merchants", []),
    apiGet<Commission[]>("/api/agent/commissions", []),
    apiGet<{ rule?: { minMerchantFeeRate: string } | null; merchants: Merchant[] }>("/api/agent/merchant-fees", { merchants: [] }),
  ]);
  const minRate = Number(feePayload.rule?.minMerchantFeeRate ?? 0.1);
  const agentStats = [
    { label: "今日佣金", value: money(dashboard.commissionIncome), tone: "success" as const, trend: "+7.8%" },
    { label: "本月佣金", value: money(Number(dashboard.commissionIncome) * 22), tone: "brand" as const, trend: "+12.1%" },
    { label: "活跃商户", value: String(dashboard.merchantCount), tone: "cyan" as const, trend: "Live" },
    { label: "商户成功率", value: "98.2%", tone: "success" as const, trend: "+1.3%" },
    { label: "今日交易额", value: money(dashboard.todayVolume), tone: "brand" as const, trend: "+6.4%" },
    { label: "今日订单量", value: String(commissions.length), tone: "cyan" as const, trend: "+4.2%" },
  ];
  const merchantsWithFees = feePayload.merchants.length ? feePayload.merchants : merchants;
  const merchantRows = merchants.map((merchant) => [
    merchant.name,
    `${Number(merchantsWithFees.find((item) => item.id === merchant.id)?.merchantChannels?.[0]?.merchantFeeRate ?? 0.12) * 100}%`,
    `${Math.max(0, Number(merchantsWithFees.find((item) => item.id === merchant.id)?.merchantChannels?.[0]?.merchantFeeRate ?? 0.12) - minRate) * 100}%`,
    merchantsWithFees.find((item) => item.id === merchant.id)?.merchantChannels?.[0]?.channel?.supplier?.name ?? "Sandbox PSP",
    <StatusBadge key={`${merchant.name}-status`} status={merchant.status} />,
    "98.2%",
  ]);
  const commissionRows = commissions.map((commission) => [
    commission.orderNo,
    money(commission.amount),
    `${Number(commission.commissionRate) * 100}%`,
    money(commission.commissionAmount),
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Agent Center" role="Agent Admin">
      <SectionHeader eyebrow="Agent Operations" title="代理运营总览" text="代理可直接查看佣金、活跃商户、商户成功率和费率利润空间。" />
      <section className="grid-fit">
        {agentStats.map((stat) => (
          <OpsMetricCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="mt-8 grid gap-8 xl:grid-cols-2">
        <div id="merchants">
          <h2 className="mb-3 text-lg font-black text-slate-950">我的商户运营</h2>
          <div className="mb-3">
            <SearchInput placeholder="Search merchants" />
          </div>
          <DataTable columns={["商户名称", "当前费率", "利润空间", "当前 PSP", "状态", "今日成功率"]} rows={merchantRows} />
        </div>
        <div id="commissions">
          <h2 className="mb-3 text-lg font-black text-slate-950">佣金/利润</h2>
          <DataTable columns={["Order", "Amount", "Rate", "Commission"]} rows={commissionRows} />
        </div>
      </section>
      <section id="orders" className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">订单统计</h2>
          <p className="mt-2 text-sm leading-6 text-muted">按商户观察交易额、成功率和订单量。</p>
          <div className="mt-4"><SimpleBars labels={["今日交易额", "今日订单量", "商户成功率", "备用通道占比"]} /></div>
        </div>
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">提现规则</h2>
          <p className="mt-2 text-sm leading-6 text-muted">代理可在商户费率设置页查看和维护商户提现规则。</p>
          <a href="/agent/merchant-fees#withdraw-rules" className="button secondary mt-4">查看提现规则</a>
        </div>
      </section>
      <section id="account" className="mt-8 surface p-5">
        <h2 className="text-lg font-black text-slate-950">Account Center</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Agent profile, payout setup and contact preferences can be presented here during demos.</p>
      </section>
    </DashboardShell>
  );
}
