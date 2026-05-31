import { ApplyForm } from "@/components/ApplyForm";
import { Nav } from "@/components/Nav";

export default function MerchantApplyPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="px-5 py-16">
        <p className="text-center text-sm font-bold uppercase tracking-[.18em] text-cyan">Merchant Application</p>
        <h1 className="mx-auto mb-8 mt-4 max-w-3xl text-center text-5xl font-black leading-tight text-slate-950">Start accepting payments with FXpay.</h1>
        <ApplyForm type="Merchant" />
      </section>
    </main>
  );
}
