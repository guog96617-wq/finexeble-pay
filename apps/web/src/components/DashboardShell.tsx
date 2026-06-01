import { Header, MobileNav, NavItem, PageContainer, Sidebar } from "./AppLayout";
import { AuthGuard } from "./AuthGuard";
import { UserRole } from "@/lib/auth";

const defaultNav: NavItem[] = [
  ["Dashboard", "#dashboard"],
  ["Orders", "#orders"],
  ["Wallet", "#wallet"],
  ["API", "#api"],
  ["Audit", "#audit"],
];

const adminNav: NavItem[] = [
  { section: "仪表台", items: [["Dashboard", "/admin"]] },
  { section: "支付运营", items: [["风险告警", "/admin/risk-alerts"], ["订单管理", "/admin/orders"], ["PSP 管理", "/admin/psp"], ["通道管理", "/admin/channels"], ["Checkout 订单", "/admin/checkout-orders"], ["Webhook 日志", "/admin/webhooks"]] },
  { section: "商户体系", items: [["商户管理", "/admin/merchants"], ["Merchant 360", "/admin/merchants"]] },
  { section: "代理体系", items: [["代理管理", "/admin/agents"], ["代理费率规则", "/admin/agent-fee-rules"]] },
  { section: "资金与结算", items: [["钱包流水", "/admin/wallet"], ["提现审核", "/admin/withdraws"], ["提现规则", "/admin/withdraw-rules"]] },
  { section: "费率与利润", items: [["商户费率", "/admin/merchants"], ["商户 PSP 配置", "/admin/merchant-psp-status"], ["PSP 成本", "/admin/channels"], ["平台利润", "/admin"]] },
  { section: "开发者中心", items: [["插件管理", "/admin/plugins"], ["API 日志", "/admin/api-logs"], ["SDK / Docs 管理", "/admin/developer-center"]] },
  { section: "系统与安全", items: [["用户管理", "/admin/users"], ["审计日志", "/admin/audit-logs"], ["系统设置", "/admin/system-settings"]] },
];

const agentNav: NavItem[] = [
  { section: "仪表台", items: [["Dashboard", "/agent"]] },
  { section: "商户运营", items: [["我的商户", "/agent/merchants"], ["商户 PSP", "/agent/payment-methods"], ["商户费率", "/agent/merchant-fees"], ["商户提现规则", "/agent/withdraw-rules"]] },
  { section: "订单与交易", items: [["订单管理", "/agent/orders"], ["Checkout 订单", "/agent/checkout-orders"]] },
  { section: "资金与收益", items: [["我的佣金", "/agent/commissions"], ["钱包", "/agent/wallet"], ["提现管理", "/agent/withdraws"]] },
  { section: "开发者", items: [["API 文档", "/docs/api"]] },
  { section: "账户与安全", items: [["个人设置", "/agent/settings"]] },
];

const merchantNav: NavItem[] = [
  { section: "仪表台", items: [["Dashboard", "/merchant"]] },
  { section: "支付与订单", items: [["创建订单", "/merchant/create-order"], ["订单管理", "/merchant/orders"], ["Checkout 订单", "/merchant/checkout-orders"]] },
  { section: "资金中心", items: [["钱包", "/merchant/wallet"], ["提现", "/merchant/withdraws"], ["提现记录", "/merchant/withdraw-records"]] },
  { section: "支付方式", items: [["我的支付方式", "/merchant/payment-methods"], ["PSP / 通道状态", "/merchant/psp-status"]] },
  { section: "开发者", items: [["API Keys", "/merchant/developers"], ["Webhook", "/merchant/webhooks"], ["Webhook 日志", "/merchant/webhook-logs"], ["API 文档", "/docs/api"], ["SDK 下载", "/merchant/sdk"], ["插件中心", "/merchant/plugins"]] },
  { section: "账户", items: [["账户设置", "/merchant/settings"]] },
];

function navForRole(requiredRole: UserRole) {
  if (requiredRole === "SUPER_ADMIN") return adminNav;
  if (requiredRole === "AGENT_ADMIN") return agentNav;
  if (requiredRole === "MERCHANT_ADMIN") return merchantNav;
  return defaultNav;
}

export function DashboardShell({
  title,
  children,
  nav,
  role = "Console",
  requiredRole,
}: {
  title: string;
  children: React.ReactNode;
  nav?: NavItem[];
  role?: string;
  requiredRole: UserRole;
}) {
  const shellNav = nav ?? navForRole(requiredRole);
  return (
    <AuthGuard requiredRole={requiredRole}>
      <main id="dashboard" className="min-h-screen bg-ink">
        <Sidebar nav={shellNav} />
        <section className="min-h-screen lg:pl-72">
          <Header title={title} role={role} breadcrumbs={["FXpay", role]} />
          <MobileNav nav={shellNav} />
          <PageContainer>{children}</PageContainer>
        </section>
      </main>
    </AuthGuard>
  );
}
