import { ApplyForm } from "@/components/ApplyForm";
import { Nav } from "@/components/Nav";

export default function MerchantApplyPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="px-5 py-16">
        <h1 className="mb-8 text-center text-4xl font-black">Merchant Application</h1>
        <ApplyForm type="Merchant" />
      </section>
    </main>
  );
}
