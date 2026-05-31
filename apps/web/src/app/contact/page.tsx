import { Nav } from "@/components/Nav";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">Contact</p>
        <h1 className="mt-4 text-5xl font-black leading-tight text-slate-950">Talk to the FXpay team.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">Tell us about your payment markets, provider needs and merchant onboarding plan.</p>
        <div className="surface mt-8 grid gap-4 p-5">
          <label className="text-sm font-semibold text-slate-700">Name</label>
          <input placeholder="Name" />
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input placeholder="Email" />
          <label className="text-sm font-semibold text-slate-700">Payment needs</label>
          <textarea placeholder="Tell us about your payment needs" rows={6} />
          <button type="button">Send message</button>
          <p className="text-sm text-muted">Email, Telegram and WhatsApp placeholders can be configured for your sales team.</p>
        </div>
      </section>
    </main>
  );
}
