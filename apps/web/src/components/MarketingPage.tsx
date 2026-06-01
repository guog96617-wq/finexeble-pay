import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Nav } from "./Nav";

export function MarketingPage({ eyebrow, title, text, items }: { eyebrow: string; title: string; text: string; items: { title: string; text: string }[] }) {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-brand">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-slate-950">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{text}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contact-sales" className="button">Contact Sales</Link>
          <Link href="/docs/api" className="button secondary">View Docs</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="surface p-5">
            <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
          </div>
        ))}
      </section>
      <footer className="border-t border-line bg-white px-5 py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <BrandLogo />
          <span>Finexeble FXpay productized SaaS payment platform.</span>
        </div>
      </footer>
    </main>
  );
}
