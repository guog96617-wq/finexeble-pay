import { Nav } from "@/components/Nav";

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">Developers</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-slate-950">API documentation for signed merchant payments.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Swagger is available on the API service at `http://localhost:4000/docs`.</p>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Code title="Create Payment" code={"POST /api/v1/payments/create\nX-API-KEY: pk_demo_global_shop\nX-TIMESTAMP: 1760000000000\nX-NONCE: unique_nonce\nX-SIGNATURE: hmac_sha256(...)\n\n{\n  \"merchantOrderNo\": \"M202600001\",\n  \"amount\": \"100.00\",\n  \"currency\": \"USD\"\n}"} />
          <Code title="Webhook Payload" code={"{\n  \"event\": \"payment.success\",\n  \"orderNo\": \"P202600001\",\n  \"merchantOrderNo\": \"M202600001\",\n  \"amount\": \"100.00\",\n  \"currency\": \"USD\",\n  \"status\": \"PAID\"\n}"} />
        </div>
        <div className="mt-8 grid-fit">
          {["Quick Start", "Authentication", "Create Payment", "Query Order", "Refund", "Webhook", "Error Codes"].map((item) => (
            <div key={item} className="surface p-4">
              <h2 className="font-black text-slate-950">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Developer guide placeholder for the commercial documentation system.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Code({ title, code }: { title: string; code: string }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-line bg-slate-50 px-4 py-3 font-bold text-slate-800">{title}</div>
      <pre className="overflow-auto bg-slate-950 p-4 text-sm leading-6 text-cyan">{code}</pre>
    </div>
  );
}
