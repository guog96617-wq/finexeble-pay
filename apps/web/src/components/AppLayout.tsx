import { ReactNode } from "react";
import { LayoutDashboard, RefreshCw, Search } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { LogoutButton } from "./LogoutButton";

export type NavLink = [string, string, string?];
export type NavItem = NavLink | { section: string; items: NavLink[] };

function isSection(item: NavItem): item is { section: string; items: NavLink[] } {
  return !Array.isArray(item);
}

function NavAnchor({ item }: { item: NavLink }) {
  const [label, href, description] = item;
  return (
    <a title={description} href={href} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-brand" />
      <span className="truncate">{label}</span>
    </a>
  );
}

export function Sidebar({ nav }: { nav: NavItem[] }) {
  return (
    <aside className="fixed hidden h-screen w-72 overflow-y-auto border-r border-line bg-white/92 p-5 shadow-[12px_0_40px_rgba(15,23,42,.04)] backdrop-blur-xl lg:block">
      <BrandLogo variant="sidebar" priority />
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Workspace</p>
        <p className="mt-1 text-sm font-black text-slate-900">Finexeble Demo</p>
      </div>
      <nav className="mt-6 grid gap-1">
        {nav.map((item, index) =>
          isSection(item) ? (
            <div key={item.section} className={index === 0 ? "" : "mt-4"}>
              <p className="mb-1 px-3 text-xs font-black uppercase tracking-[.16em] text-slate-400">{item.section}</p>
              <div className="grid gap-1">
                {item.items.map((link) => <NavAnchor key={`${item.section}-${link[0]}`} item={link} />)}
              </div>
            </div>
          ) : (
            <NavAnchor key={item[0]} item={item} />
          ),
        )}
      </nav>
      <div className="sticky bottom-0 mt-6 bg-white/92 pt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}

export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-muted">
      {items.map((item, index) => (
        <span key={item} className={index === items.length - 1 ? "text-brand" : ""}>
          {item}
          {index < items.length - 1 ? <span className="ml-2 text-slate-300">/</span> : null}
        </span>
      ))}
    </div>
  );
}

export function UserMenu({ role }: { role: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 shadow-sm">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-xs font-black text-brand">FX</div>
      <div className="hidden leading-tight sm:block">
        <p className="text-sm font-bold text-slate-900">{role}</p>
        <p className="text-xs text-muted">Demo workspace</p>
      </div>
    </div>
  );
}

export function Header({ title, role, breadcrumbs }: { title: string; role: string; breadcrumbs: string[] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/80 px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Breadcrumb items={breadcrumbs} />
          <div className="mt-2 flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-brand" />
            <h1 className="text-xl font-black">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted shadow-sm md:flex">
            <Search className="h-4 w-4" />
            <span>Search orders, merchants...</span>
          </div>
          <a href="" className="hidden rounded-lg border border-line bg-white p-2 text-slate-500 shadow-sm hover:text-brand md:inline-flex" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </a>
          <UserMenu role={role} />
          <div className="lg:hidden">
            <LogoutButton compact />
          </div>
        </div>
      </div>
    </header>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl p-5">{children}</div>;
}

function flattenNav(nav: NavItem[]): NavLink[] {
  return nav.flatMap((item) => (isSection(item) ? item.items : [item]));
}

export function MobileNav({ nav }: { nav: NavItem[] }) {
  const links = flattenNav(nav);
  return (
    <div className="sticky top-[89px] z-10 border-b border-line bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex gap-2 overflow-x-auto">
        {links.map(([label, href]) => (
          <a key={label} href={href} className="shrink-0 rounded-full border border-line bg-white px-3 py-2 text-xs font-bold text-slate-600">
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
