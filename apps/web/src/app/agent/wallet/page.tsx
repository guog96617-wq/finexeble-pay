import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { OpsMetricCard, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Commission = {
  orderNo: string;
  amount: string;
  commissionAmount: number;
  createdAt?: string;
};

export default async function AgentWalletPage() {
  const commissions = await apiGet<Commission[]>("/api/agent/commissions", []);
  const available = commissions.reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const rows = commissions.map((item) => [
    "COMMISSION_IN",
    item.orderNo,
    money(item.commissionAmount),
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Wallet" role="Agent Admin">
      <SectionHeader
        eyebrow="Funds & Revenue"
        title="钱包"
        text="钱包页面只负责余额与佣金流水展示。提现请前往“提现管理”。"
        status="ACTIVE"
        action={<a href="/agent/withdraws" className="button">前往提现管理</a>}
      />

      <section className="grid-fit">
        <OpsMetricCard label="佣金余额" value={money(available)} tone="success" trend="Balance" />
        <OpsMetricCard label="可提现余额" value={money(available)} tone="brand" trend="Available" />
        <OpsMetricCard label="冻结金额" value={money(0)} tone="warn" trend="Frozen" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">佣金趋势</h2>
          <p className="mt-2 text-sm text-muted">用于观察代理收益变化。</p>
          <div className="mt-4"><SimpleBars labels={["今日佣金", "7日佣金", "30日佣金", "可提现", "已结算"]} /></div>
        </div>
        <div className="surface p-5">
          <h2 className="text-lg font-black text-slate-950">资金说明</h2>
          <p className="mt-2 text-sm text-slate-700">
            当前版本代理钱包基于佣金流水计算。提现申请会在“提现管理”模块提交并进入审核状态。
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="佣金流水" text="仅展示代理佣金入账记录。" />
        <DataTable
          columns={["类型", "订单号", "金额", "时间"]}
          rows={rows}
          empty="暂无佣金流水。"
        />
      </section>
    </DashboardShell>
  );
}
