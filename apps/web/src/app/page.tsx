import Link from "next/link";
import { ArrowRight, Blocks, CheckCircle2, Code2, Globe2, Network, ShieldCheck, WalletCards, Webhook } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Nav } from "@/components/Nav";
import { StatsCard } from "@/components/StatsCard";
import { brand } from "@/lib/brand";

const trustItems = ["Multi-provider routing", "Merchant dashboard", "Agent management", "API integration", "Plugin ready"];

const features = [
  ["Payment orchestration", "Route transactions across primary and backup PSP channels with payment attempt visibility.", Network],
  ["Merchant management", "Operate merchant wallets, API keys, webhooks, orders and withdrawals from one console.", WalletCards],
  ["Agent commission", "Track agent merchants, trade volume and commission income with clear financial reporting.", Globe2],
  ["PSP channel management", "Present provider status, backup roles and fee awareness for operations teams.", ShieldCheck],
  ["Wallet & withdrawals", "Keep balances, frozen funds and admin withdrawal review readable for finance teams.", WalletCards],
  ["Webhook & API security", "Use HMAC headers, nonce protection and webhook logs to support reliable integrations.", Webhook],
] as const;

const plugins = ["Shopify", "WooCommerce", "Shopline", "Magento", "OpenCart"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_6%,rgba(56,189,248,.28),transparent_28rem),radial-gradient(circle_at_88%_10%,rgba(124,58,237,.16),transparent_30rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_62%,#eef6ff_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-cyan">{brand.positioning}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.04] text-slate-950 md:text-6xl">
              Global payments made simple for merchants and agents.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Connect multiple payment providers, manage merchants, route transactions, and settle funds from one modern FXpay platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply/merchant" className="button">
                Start accepting payments <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/docs/api" className="button secondary">
                View API docs
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {trustItems.map((item) => (
                <span key={item} className="rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-sm font-semibold text-slate-600 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="surface overflow-hidden p-4 shadow-glow">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-sm font-bold text-slate-950">Payment Operations</p>
                  <p className="text-xs text-muted">Live demo dashboard</p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-success">Healthy routing</span>
              </div>
              <div className="grid-fit mt-4">
                <StatsCard label="Today Volume" value="$24,820" tone="brand" caption="+18.2%" />
                <StatsCard label="Success Rate" value="98.7%" tone="success" caption="+2.1%" />
                <StatsCard label="Orders" value="1,284" tone="cyan" caption="Live" />
                <StatsCard label="Wallet Balance" value="$86,120" tone="warn" caption="Settled" />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="surface overflow-hidden">
                <div className="border-b border-line bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">API request</div>
                <pre className="overflow-auto bg-slate-950 p-4 text-xs leading-6 text-cyan">{`POST /api/v1/payments/create
X-API-KEY: pk_demo_global_shop
X-SIGNATURE: hmac_sha256(...)

{
  "amount": "100.00",
  "currency": "USD"
}`}</pre>
              </div>
              <div className="surface p-4">
                {["Primary channel failed", "Backup channel selected", "Webhook queued", "Wallet ledger posted"].map((item) => (
                  <div key={item} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <SectionTitle eyebrow="Platform" title="Built for payment teams that need speed, control and financial clarity." />
        <div className="grid-fit">
          {features.map(([title, text, Icon]) => (
            <Feature key={title} icon={<Icon />} title={title} text={text} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white/75">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <SectionTitle
            eyebrow="Developers"
            title="Signed APIs, HMAC authentication and webhook observability."
            text="Launch payment creation, order query, refund placeholders and webhook integrations from a readable developer center."
          />
          <div className="grid gap-4">
            {["Quick Start", "Authentication", "Create Payment", "Query Order", "Webhook", "Error Codes"].map((item) => (
              <div key={item} className="surface flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-brand" />
                  <span className="font-bold text-slate-800">{item}</span>
                </div>
                <span className="text-sm font-semibold text-muted">Ready</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <SectionTitle eyebrow="Plugins" title="Commerce connectors prepared for merchant onboarding." />
        <div className="grid-fit">
          {plugins.map((plugin, index) => (
            <Feature key={plugin} icon={<Blocks />} title={plugin} text={index < 3 ? "Available integration guide with API key and webhook setup." : "Coming soon package placeholder for sales demos."} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="surface grid gap-6 overflow-hidden p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-cyan">How it works</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">PSP to FXpay to Agent to Merchant to Customer.</h2>
            <p className="mt-3 max-w-2xl text-slate-600">Use one operating layer to manage provider routing, agent distribution, merchant finance and customer payment status.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-blue-700">
            {["PSP", "FXpay", "Agent", "Merchant", "Customer"].map((step) => (
              <span key={step} className="rounded-full bg-blue-50 px-4 py-2">{step}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff_48%,#f5f3ff)] p-8 shadow-card lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-brand">Ready to launch your payment operation?</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Start with a merchant or agent workspace.</h2>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link href="/apply/merchant" className="button">Apply as Merchant</Link>
            <Link href="/apply/agent" className="button secondary">Become an Agent</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white px-5 py-10 text-sm text-muted">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-sm leading-6">{brand.description}</p>
          </div>
          <FooterGroup title="Product" items={["Payments", "Routing", "Wallets", "Withdrawals"]} />
          <FooterGroup title="Developers" items={["API Docs", "HMAC Signature", "Webhooks", "Plugins"]} />
          <FooterGroup title="Company" items={["Contact", "Merchant Apply", "Agent Program", "Copyright 2026"]} />
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="surface p-5 transition hover:-translate-y-1 hover:shadow-glow">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand">{icon}</div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mb-8">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-cyan">{eyebrow}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-black text-slate-950 md:text-4xl">{title}</h2>
      {text ? <p className="mt-3 max-w-2xl text-slate-600">{text}</p> : null}
    </div>
  );
}

function FooterGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-black text-slate-900">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
