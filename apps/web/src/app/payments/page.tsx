import { Nav } from "@/components/Nav";

const steps = [
  "Merchant creates order through signed API request",
  "System validates API key, timestamp, nonce and HMAC signature",
  "Routing selects primary channel by currency and priority",
  "Failed primary attempt is recorded and backup channel is tried",
  "PSP callback updates order status and merchant balance",
  "Webhook notification is signed and queued for merchant delivery",
];

export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">Payments</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-slate-950">The core flow from signed order to wallet settlement.</h1>
        <div className="mt-10 grid gap-4">
          {steps.map((step, index) => (
            <div key={step} className="surface flex items-center gap-4 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 font-black text-brand">{index + 1}</span>
              <p className="font-semibold text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
