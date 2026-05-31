import Link from "next/link";
import { LayoutDashboard, ShieldCheck, WalletCards } from "lucide-react";

const nav = [
  ["Dashboard", "#"],
  ["Orders", "#orders"],
  ["Wallet", "#wallet"],
  ["API", "#api"],
  ["Audit", "#audit"],
];

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-ink">
      <aside className="fixed hidden h-screen w-64 border-r border-line bg-[#08172a] p-5 lg:block">
        <Link href="/" className="flex items-center gap-2 font-black">
          <WalletCards className="h-5 w-5 text-cyan" />
          PayHub
        </Link>
        <nav className="mt-8 grid gap-2">
          {nav.map(([label, href]) => (
            <a key={label} href={href} className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-panel hover:text-white">
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <section className="min-h-screen lg:pl-64">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-brand" />
            <h1 className="text-xl font-black">{title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-success" />
            MFA ready
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-5">{children}</div>
      </section>
    </main>
  );
}
