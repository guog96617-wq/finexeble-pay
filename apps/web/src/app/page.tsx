import Link from "next/link";
import { ArrowRight, Network, ShieldCheck, WalletCards } from "lucide-react";
import { Nav } from "@/components/Nav";
import { MetricCard } from "@/components/MetricCard";
import { modules, stats } from "@/lib/data";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(32,212,255,.18),transparent_34%),linear-gradient(135deg,#06111f_0%,#0d2d55_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-cyan">Global Payment Hub Starter V1.1</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Payment aggregation operations in one control plane.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Run merchants, agents, PSP channels, payment routing, wallets, withdrawals, webhooks, SDKs, plugins and audit logs from a single MVP.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/admin" className="button">
                Open console <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/docs/api" className="button secondary">
                View API docs
              </Link>
            </div>
          </div>
          <div className="surface shadow-glow">
            <div className="border-b border-line p-4">
              <p className="text-sm text-slate-400">Live operations snapshot</p>
            </div>
            <div className="grid-fit p-4">
              {stats.map((stat) => (
                <MetricCard key={stat.label} {...stat} />
              ))}
            </div>
            <div className="grid gap-3 border-t border-line p-4">
              {["Primary channel failed", "Backup channel selected", "Webhook queued", "Wallet ledger posted"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-[#08172a] p-3 text-sm text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid-fit">
          <Feature icon={<WalletCards />} title="Wallet finance" text="Balances, frozen funds, withdrawals and immutable ledger records." />
          <Feature icon={<Network />} title="Routing center" text="Primary and backup PSP channel selection with payment attempt logs." />
          <Feature icon={<ShieldCheck />} title="Security center" text="JWT login, MFA-ready accounts, HMAC API signatures and audit logs." />
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <div key={module} className="rounded-lg border border-line bg-panel/70 px-4 py-3 text-sm text-slate-200">
              {module}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="surface p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15 text-cyan">{icon}</div>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}
