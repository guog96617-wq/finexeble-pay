import { Nav } from "@/components/Nav";

const modules = [
  ["Operations", "Merchant, agent, supplier and channel management for payment operators."],
  ["Acquiring", "Create orders, inspect payment attempts and present checkout URLs."],
  ["Routing", "Fail over from primary PSP channel to backup channels with clear logs."],
  ["Finance", "Wallet balances, ledger records, frozen funds and withdrawal review."],
  ["Developer", "API docs, SDK packages, API keys and webhook configuration."],
  ["Security", "HMAC signatures, JWT sessions, audit-friendly events and safe defaults."],
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">Product</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-slate-950">A commercial payment operations platform for global teams.</h1>
        <div className="mt-10 grid-fit">
          {modules.map(([title, text]) => (
            <div key={title} className="surface p-5">
              <h2 className="font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
