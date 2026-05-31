import { Nav } from "@/components/Nav";

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-black">Product Modules</h1>
        <div className="mt-8 grid-fit">
          {[
            ["Operations", "Merchant, agent, supplier and channel management."],
            ["Acquiring", "Create orders, refunds, attempts and payment URLs."],
            ["Routing", "Fail over from primary PSP channel to backup channels."],
            ["Finance", "Wallet balances, ledger, fees and withdrawal review."],
            ["Developer", "API docs, SDK packages, API keys and webhook config."],
            ["Security", "MFA, JWT sessions, HMAC signatures and audit logs."],
          ].map(([title, text]) => (
            <div key={title} className="surface p-5">
              <h2 className="font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
