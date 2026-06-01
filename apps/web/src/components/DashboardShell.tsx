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
  ["Dashboard", "/admin"],
  { section: "运营管理", items: [["商户管理", "/admin/merchants"], ["代理商管理", "/admin/agents"], ["PSP 管理", "/admin/psp"], ["通道管理", "/admin/channels"]] },
  { section: "费率与规则", items: [["代理费率规则", "/admin/agents#fee-rules"], ["商户费率配置", "/admin/merchants#merchant-fees"], ["提现规则", "/admin/withdraw-rules"]] },
  { section: "交易与资金", items: [["订单管理", "/admin#orders"], ["Checkout 订单", "/admin/checkout-orders"], ["钱包流水", "/admin#wallet"], ["提现审核", "/admin#withdraws"]] },
  { section: "开发者与插件", items: [["API 日志", "/admin#api-logs"], ["Webhook 日志", "/admin#webhooks"], ["插件管理", "/admin#plugins"]] },
  { section: "系统与安全", items: [["用户管理", "/admin#users"], ["审计日志", "/admin#audit"], ["系统设置", "/admin#settings"]] },
];

const agentNav: NavItem[] = [
  ["Dashboard", "/agent"],
  { section: "商户运营", items: [["我的商户", "/agent#merchants"], ["商户 PSP 开关", "/agent/payment-methods"], ["商户费率设置", "/agent/merchant-fees"]] },
  { section: "资金与收益", items: [["订单统计", "/agent#orders"], ["佣金/利润", "/agent#commissions"], ["提现规则", "/agent/merchant-fees#withdraw-rules"]] },
];

const merchantNav: NavItem[] = [
  ["Dashboard", "/merchant"],
  { section: "收款运营", items: [["订单管理", "/merchant#orders"], ["创建订单", "/merchant#order-form"], ["我的支付方式", "/merchant/payment-methods"], ["Checkout 链接", "/merchant/payment-methods#checkout-help"]] },
  { section: "资金管理", items: [["钱包余额", "/merchant#wallet"], ["提现申请", "/merchant#withdraws"], ["提现规则", "/merchant/payment-methods#withdraw-rule"]] },
  { section: "开发者", items: [["API Key", "/merchant#api"], ["Webhook 配置", "/merchant#webhook"], ["SDK 插件", "/merchant#sdk"]] },
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
