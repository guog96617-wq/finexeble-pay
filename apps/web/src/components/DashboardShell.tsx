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
  { section: "Dashboard", items: [["Dashboard", "/admin"]] },
  { section: "Payment operations", items: [["Risk alerts", "/admin/risk-alerts"], ["Orders", "/admin/orders"], ["Channel library", "/admin/channels"], ["Checkout orders", "/admin/checkout-orders"], ["Webhook logs", "/admin/webhooks"]] },
  { section: "Merchants", items: [["Merchant list", "/admin/merchants"], ["Merchant supervision", "/admin/merchant-psp-status"]] },
  { section: "Agents", items: [["Agent list", "/admin/agents"], ["Agent fee rules", "/admin/agent-fee-rules"]] },
  { section: "Funds", items: [["Wallet ledger", "/admin/wallet"], ["Withdraw review", "/admin/withdraws"], ["Withdraw rules", "/admin/withdraw-rules"]] },
  { section: "Profit", items: [["PSP cost", "/admin/channels"], ["Platform profit", "/admin/orders"], ["Agent profit", "/admin/agents"]] },
  { section: "Developers", items: [["Plugins", "/admin/plugins"], ["API logs", "/admin/api-logs"], ["SDK / Docs", "/admin/developer-center"]] },
  { section: "System", items: [["Users", "/admin/users"], ["Audit logs", "/admin/audit-logs"], ["Settings", "/admin/system-settings"]] },
];

const agentNav: NavItem[] = [
  { section: "Dashboard", items: [["Dashboard", "/agent"]] },
  { section: "Merchant operations", items: [["My merchants", "/agent/merchants"], ["My available channels", "/agent/payment-methods"], ["Merchant fees", "/agent/merchant-fees"], ["Merchant withdraw rules", "/agent/withdraw-rules"]] },
  { section: "Orders", items: [["Orders", "/agent/orders"], ["Checkout orders", "/agent/checkout-orders"]] },
  { section: "Funds", items: [["My commission", "/agent/commissions"], ["Wallet", "/agent/wallet"], ["Withdraws", "/agent/withdraws"]] },
  { section: "Developers", items: [["API docs", "/docs/api"]] },
  { section: "Account", items: [["Settings", "/agent/settings"]] },
];

const merchantNav: NavItem[] = [
  { section: "Dashboard", items: [["Dashboard", "/merchant"]] },
  { section: "Payments", items: [["Orders", "/merchant/orders"], ["Checkout orders", "/merchant/checkout-orders"]] },
  { section: "Funds", items: [["Wallet", "/merchant/wallet"], ["Withdraw", "/merchant/withdraws"], ["Withdraw records", "/merchant/withdraw-records"]] },
  { section: "Channels", items: [["My payment channels", "/merchant/payment-methods"]] },
  { section: "Developers", items: [["API Keys", "/merchant/developers"], ["Webhook", "/merchant/webhooks"], ["Webhook logs", "/merchant/webhook-logs"], ["API docs", "/docs/api"], ["SDK", "/merchant/sdk"], ["Plugins", "/merchant/plugins"]] },
  { section: "Account", items: [["Settings", "/merchant/settings"]] },
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
