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

export function DashboardShell({
  title,
  children,
  nav = defaultNav,
  role = "Console",
  requiredRole,
}: {
  title: string;
  children: React.ReactNode;
  nav?: NavItem[];
  role?: string;
  requiredRole: UserRole;
}) {
  return (
    <AuthGuard requiredRole={requiredRole}>
      <main id="dashboard" className="min-h-screen bg-ink">
        <Sidebar nav={nav} />
        <section className="min-h-screen lg:pl-64">
          <Header title={title} role={role} breadcrumbs={["FXpay", role]} />
          <MobileNav nav={nav} />
          <PageContainer>{children}</PageContainer>
        </section>
      </main>
    </AuthGuard>
  );
}
