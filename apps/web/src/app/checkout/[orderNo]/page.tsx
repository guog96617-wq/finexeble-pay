import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CheckoutPayBox } from "@/components/V15Forms";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = { order: { orderNo: string; merchantOrderNo: string; amount: string; currency: string; status: string; paymentUrl?: string; merchant?: { name: string } }; merchant?: { name: string }; paymentMethods: string[]; channels: { channel: { name: string; paymentMethod: string } }[] };

export default async function CheckoutPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const payload = await apiGet<Payload | null>(`/api/checkout/${orderNo}`, null);
  if (!payload) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="surface p-6">Order not found.</div></main>;
  }
  const order = payload.order;
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#eef5ff_100%)] p-5">
      <section className="mx-auto grid max-w-3xl gap-6 py-10">
        <BrandLogo priority />
        <div className="surface grid gap-5 p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">FXpay Checkout</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{payload.merchant?.name ?? order.merchant?.name}</h1>
            <p className="mt-1 text-sm text-muted">Order {order.orderNo} / Merchant order {order.merchantOrderNo}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm text-blue-700">Amount due</p>
            <p className="mt-1 text-4xl font-black text-blue-950">{money(order.amount, order.currency)}</p>
            <p className="mt-2 text-sm font-bold text-slate-700">Status: {order.status}</p>
          </div>
          <div>
            <h2 className="font-black text-slate-950">Payment methods</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {payload.paymentMethods.map((method) => <div key={method} className="rounded-xl border border-line bg-white p-3 text-sm font-bold text-slate-700">{method.replace("_", " ")}</div>)}
            </div>
          </div>
          <CheckoutPayBox orderNo={order.orderNo} />
          <p className="text-sm text-muted">Secure sandbox checkout. No real card or bank transfer is processed in this environment.</p>
          <Link className="button secondary w-fit" href="/merchant">Return to merchant</Link>
        </div>
      </section>
    </main>
  );
}
