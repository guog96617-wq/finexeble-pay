import { Nav } from "@/components/Nav";

export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-black">Payment Capability</h1>
        <div className="mt-8 grid gap-4">
          {[
            "Merchant creates order through signed API request",
            "System validates API key, timestamp, nonce and HMAC signature",
            "Routing selects primary channel by currency and priority",
            "Failed primary attempt is recorded and backup channel is tried",
            "PSP callback updates order status and merchant balance",
            "Webhook notification is signed and queued for merchant delivery",
          ].map((step, index) => (
            <div key={step} className="surface flex items-center gap-4 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand font-black">{index + 1}</span>
              <p className="text-slate-200">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
