import { Nav } from "@/components/Nav";

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-black">API Documentation</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Merchant payment APIs use HMAC SHA256 signatures. Swagger is available at the API service `/docs` endpoint.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Code title="Create Payment" code={"POST /api/v1/payments/create\nX-API-KEY: pk_demo_global_shop\nX-TIMESTAMP: 1760000000000\nX-NONCE: unique_nonce\nX-SIGNATURE: hmac_sha256(...)\n\n{\n  \"merchantOrderNo\": \"M202600001\",\n  \"amount\": \"100.00\",\n  \"currency\": \"USD\"\n}"} />
          <Code title="Webhook Payload" code={"{\n  \"event\": \"payment.success\",\n  \"orderNo\": \"P202600001\",\n  \"merchantOrderNo\": \"M202600001\",\n  \"amount\": \"100.00\",\n  \"currency\": \"USD\",\n  \"status\": \"PAID\",\n  \"paidAt\": \"2026-01-01 12:00:00\"\n}"} />
        </div>
      </section>
    </main>
  );
}

function Code({ title, code }: { title: string; code: string }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-line px-4 py-3 font-bold">{title}</div>
      <pre className="overflow-auto p-4 text-sm leading-6 text-cyan">{code}</pre>
    </div>
  );
}
