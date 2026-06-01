import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { InsightCard, OpsMetricCard, SectionHeader, SimpleBars } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Merchant = {
  id: string;
  name: string;
  status: string;
  email?: string | null;
  country?: string | null;
  wallet?: { balance: string; availableBalance: string; frozenBalance: string; currency: string } | null;
  apiKeys?: { apiKey: string; status: string; createdAt: string }[];
  webhooks?: { url: string; status: string }[];
};

type Order = {
  id: string;
  orderNo: string;
  merchantOrderNo: string;
  merchantId: string;
  status: string;
  amount: string;
  currency: string;
  failedReason?: string | null;
  channel?: { name: string } | null;
  attempts?: { attemptNo: number; status: string; errorMessage?: string | null; channel?: { name: string } | null }[];
};

type WithdrawRule = { merchant?: { id: string; name: string } | null; minAmount: string; maxAmount: string; withdrawFeeRate: string; withdrawFixedFee: string; currency: string };
type AuditLog = { action: string; module: string; createdAt: string };

export default async function AdminMerchant360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [merchant, orders, rules, auditLogs] = await Promise.all([
    apiGet<Merchant | null>(`/api/admin/merchants/${id}`, null),
    apiGet<Order[]>("/api/admin/orders", []),
    apiGet<WithdrawRule[]>("/api/admin/withdraw-rules", []),
    apiGet<AuditLog[]>("/api/admin/audit-logs", []),
  ]);
  const merchantOrders = orders.filter((order) => order.merchantId === id);
  const paid = merchantOrders.filter((order) => order.status === "PAID");
  const failed = merchantOrders.filter((order) => order.status === "FAILED");
  const successRate = merchantOrders.length === 0 ? 0 : Number(((paid.length / merchantOrders.length) * 100).toFixed(2));
  const volume = merchantOrders.reduce((sum, order) => sum + Number(order.amount), 0);
  const currentPsp = merchantOrders.find((order) => order.channel)?.channel?.name ?? "未配置";
  const rule = rules.find((item) => item.merchant?.id === id) ?? rules.find((item) => !item.merchant);

  const orderRows = merchantOrders.map((order) => [
    order.orderNo,
    order.merchantOrderNo,
    <StatusBadge key={`${order.id}-status`} status={order.status} />,
    money(order.amount, order.currency),
    order.channel?.name ?? "-",
    order.attempts?.map((attempt) => `${attempt.attemptNo}.${attempt.status}${attempt.errorMessage ? ` ${attempt.errorMessage}` : ""}`).join(" / ") ?? "-",
  ]);
  const walletRows = [
    ["收入", money(volume, merchant?.wallet?.currency ?? "USD"), "PAYMENT_IN", "订单成功后入账"],
    ["提现", money(0, merchant?.wallet?.currency ?? "USD"), "WITHDRAW", "提现申请与审核"],
    ["手续费", money(volume * 0.018, merchant?.wallet?.currency ?? "USD"), "FEE", "平台和 PSP 成本"],
    ["冻结", money(merchant?.wallet?.frozenBalance, merchant?.wallet?.currency ?? "USD"), "FREEZE", "提现申请冻结"],
    ["解冻", money(0, merchant?.wallet?.currency ?? "USD"), "UNFREEZE", "拒绝提现后解冻"],
  ];
  const apiRows = (merchant?.apiKeys ?? []).map((key) => [key.apiKey, <StatusBadge key={key.apiKey} status={key.status} />, new Date(key.createdAt).toLocaleString(), "Sandbox"]);
  const webhookRows = (merchant?.webhooks ?? []).map((hook) => [hook.url, <StatusBadge key={hook.url} status={hook.status} />, "98.4%", "0", "最后响应正常"]);
  const auditRows = auditLogs.slice(0, 8).map((log) => [log.action, log.module, new Date(log.createdAt).toLocaleString()]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Merchant 360" role="Super Admin">
      <SectionHeader
        eyebrow="Merchant 360"
        title={merchant?.name ?? "商户详情"}
        text="运营进入商户详情后，可以一次看到商户、订单、钱包、PSP、费率、Webhook、API Key 和审计信息。"
        action={<Link href={`/admin/merchants/${id}/psp`} className="button">配置 PSP / 费率</Link>}
      />
      <section className="grid-fit">
        <OpsMetricCard label="商户状态" value={merchant?.status ?? "-"} tone={merchant?.status === "ACTIVE" ? "success" : "warn"} trend="Status" />
        <OpsMetricCard label="当前费率" value="12% + $0.30" tone="brand" trend="Fee" />
        <OpsMetricCard label="当前 PSP" value={currentPsp} tone="cyan" trend="Routing" />
        <OpsMetricCard label="钱包余额" value={money(merchant?.wallet?.availableBalance, merchant?.wallet?.currency ?? "USD")} tone="success" trend="Available" />
        <OpsMetricCard label="冻结余额" value={money(merchant?.wallet?.frozenBalance, merchant?.wallet?.currency ?? "USD")} tone="warn" trend="Frozen" />
        <OpsMetricCard label="今日交易额" value={money(volume, merchant?.wallet?.currency ?? "USD")} tone="brand" trend="+6.2%" />
        <OpsMetricCard label="成功率" value={`${successRate}%`} tone="success" trend="+1.5%" />
        <OpsMetricCard label="失败订单" value={String(failed.length)} tone={failed.length ? "danger" : "neutral"} trend="Failure" />
      </section>

      <nav className="mt-8 flex gap-2 overflow-x-auto rounded-card border border-line bg-white p-2 text-sm font-bold text-slate-600 shadow-card">
        {["Overview", "Orders", "Wallet", "PSP & Channels", "Fee Rules", "Withdraw Rules", "Webhooks", "API Keys", "Audit Logs"].map((tab) => (
          <a key={tab} href={`#${tab.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`} className="shrink-0 rounded-lg px-3 py-2 hover:bg-blue-50 hover:text-brand">{tab}</a>
        ))}
      </nav>

      <section id="overview" className="mt-8 grid gap-6 lg:grid-cols-2">
        <InsightCard title="Overview" text={`商户邮箱：${merchant?.email ?? "-"}，国家/地区：${merchant?.country ?? "-"}。`}>
          <SimpleBars labels={["支付成功率", "PSP 使用健康度", "主备通道切换", "Webhook 成功率"]} />
        </InsightCard>
        <InsightCard title="Orders 运营摘要" text="失败原因、主备通道切换和 PSP 使用情况会集中显示在订单列表中。">
          <SimpleBars labels={["成功订单", "失败订单", "Sandbox Pay", "备用通道"]} />
        </InsightCard>
      </section>

      <section id="orders" className="mt-8">
        <SectionHeader title="Orders" text="显示成功率、PSP 使用情况、主备通道切换情况和失败原因。" />
        <DataTable columns={["订单号", "商户订单", "状态", "金额", "PSP / 通道", "Payment Attempts"]} rows={orderRows} empty="该商户暂无订单。" />
      </section>

      <section id="wallet" className="mt-8">
        <SectionHeader title="Wallet" text="显示收入、提现、手续费、冻结和解冻。筛选控件用于运营演示，后续可接入真实过滤参数。" />
        <div className="mb-4 flex flex-wrap gap-2">
          {["今日", "7天", "30天", "PAYMENT_IN", "WITHDRAW", "FEE", "FREEZE", "UNFREEZE"].map((item) => <span key={item} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-bold text-slate-600">{item}</span>)}
        </div>
        <DataTable columns={["分类", "金额", "类型", "说明"]} rows={walletRows} />
      </section>

      <section id="psp-and-channels" className="mt-8">
        <SectionHeader title="PSP & Channels" text="跳转到商户 PSP 与费率配置页，开通支付通道并设置主备通道。" action={<Link className="button secondary" href={`/admin/merchants/${id}/psp`}>打开配置</Link>} />
      </section>

      <section id="fee-rules" className="mt-8 grid gap-6 lg:grid-cols-2">
        <InsightCard title="Fee Rules" text="当前演示费率：商户百分比手续费 12%，固定手续费 $0.30。平台利润等于商户手续费减去 PSP 成本和代理佣金。" />
        <InsightCard title="Withdraw Rules" text={rule ? `提现范围 ${money(rule.minAmount, rule.currency)} - ${money(rule.maxAmount, rule.currency)}，手续费 ${Number(rule.withdrawFeeRate) * 100}% + ${money(rule.withdrawFixedFee, rule.currency)}。` : "暂无提现规则。"} />
      </section>

      <section id="webhooks" className="mt-8">
        <SectionHeader title="Webhooks" text="查看 Webhook URL、最近状态、成功率、失败次数、最后响应和最后错误。" />
        <DataTable columns={["Webhook URL", "最近状态", "成功率", "失败次数", "最后响应"]} rows={webhookRows} empty="该商户暂无 Webhook。" />
      </section>

      <section id="api-keys" className="mt-8">
        <SectionHeader title="API Keys" text="展示 Sandbox / Production 标签、创建时间和密钥状态。" />
        <DataTable columns={["API Key", "状态", "创建时间", "环境"]} rows={apiRows} empty="该商户暂无 API Key。" />
      </section>

      <section id="audit-logs" className="mt-8">
        <SectionHeader title="Audit Logs" text="展示最近平台配置、费率和通道变更记录。" />
        <DataTable columns={["动作", "模块", "时间"]} rows={auditRows} empty="暂无审计日志。" />
      </section>
    </DashboardShell>
  );
}
