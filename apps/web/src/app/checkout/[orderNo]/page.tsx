import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CheckoutCountdown } from "@/components/CheckoutCountdown";
import { CheckoutPayBox } from "@/components/V15Forms";
import { CheckoutStatusBadge } from "@/components/CheckoutStatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Payload = {
  expired?: boolean;
  order: {
    orderNo: string;
    merchantOrderNo: string;
    amount: string;
    currency: string;
    status: string;
    paymentUrl?: string;
    merchant?: { name: string };
    attempts?: { requestPayload?: { sandboxResult?: string } | null }[];
  };
  merchant?: { name: string };
  paymentMethods: string[];
  channels: { channel: { name: string; paymentMethod: string } }[];
};

export default async function CheckoutPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const payload = await apiGet<Payload | null>(`/api/checkout/${orderNo}`, null);
  if (!payload) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="surface p-6">Order not found.</div></main>;
  }
  const order = payload.order;
  const merchantName = payload.merchant?.name ?? order.merchant?.name ?? "FXpay Merchant";
  const isTimeout = payload.expired || order.attempts?.some((attempt) => attempt.requestPayload?.sandboxResult === "timeout") || false;
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#eef5ff_100%)] p-5">
      <section className="mx-auto grid max-w-3xl gap-6 py-10">
        <BrandLogo priority />
        <div className="surface grid gap-5 p-6">
          <div>
            <p className="text-sm font-bold uppercase text-cyan">FXpay Checkout</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{merchantName}</h1>
            <p className="mt-1 text-sm text-muted">Order {order.orderNo} / Merchant order {order.merchantOrderNo}</p>
          </div>
          <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-sm text-blue-700">订单金额</p>
                <p className="mt-1 text-3xl font-black text-blue-950">{money(order.amount, order.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">当前支付状态</p>
                <div className="mt-2">
                  <CheckoutStatusBadge status={order.status} isTimeout={isTimeout} />
                </div>
              </div>
              <div>
                <p className="text-sm text-blue-700">倒计时</p>
                <p className="mt-1 text-3xl font-black text-blue-950"><CheckoutCountdown /></p>
              </div>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-800">
              安全支付说明：FXpay Sandbox 不会处理真实银行卡或银行转账。支付成功后会写入订单、payment attempts、钱包流水和 webhook 日志。
            </div>
          </div>
          <div>
            <h2 className="font-black text-slate-950">Payment methods</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {payload.paymentMethods.map((method) => (
                <div key={method} className="rounded-xl border border-line bg-white p-3 text-sm font-bold text-slate-700">
                  <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-brand">FX</div>
                  {method.replace("_", " ")}
                </div>
              ))}
            </div>
          </div>
          <CheckoutPayBox orderNo={order.orderNo} />
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            当前为 Sandbox Checkout 测试环境。
          </div>
          <Link className="button secondary w-fit" href="/merchant">Return to merchant</Link>
        </div>
      </section>
    </main>
  );
}
