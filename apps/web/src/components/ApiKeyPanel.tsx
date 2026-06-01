import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import { InsightCard, SimpleBars } from "./ProductOps";

type ApiKey = {
  apiKey: string;
  status: string;
  createdAt: string;
};

export function ApiKeyPanel({ apiKeys }: { apiKeys: ApiKey[] }) {
  const curl = `curl -X POST "$API_URL/api/v1/payments/create" \\
  -H "X-API-KEY: pk_demo_global_shop" \\
  -H "X-TIMESTAMP: 1760000000000" \\
  -H "X-NONCE: unique_nonce" \\
  -H "X-SIGNATURE: hmac_sha256(secret, timestamp + nonce + body)" \\
  -d '{"merchantOrderNo":"M202600001","amount":"100.00","currency":"USD"}'`;
  return (
    <div className="grid gap-4">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Developer Center</h2>
            <p className="text-sm text-muted">API keys, signature rules and quick start references for merchant integration.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">Sandbox</span>
            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Production ready</span>
            <button type="button" className="button secondary">一键复制</button>
          </div>
        </div>
        <DataTable columns={["API Key", "Status", "Created", "Environment", "Secret"]} rows={apiKeys.map((key, index) => [key.apiKey, <StatusBadge key={key.apiKey} status={key.status} />, new Date(key.createdAt).toLocaleString(), index === 0 ? "Sandbox" : "Production", "sk_demo_********"])} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">Signature Rules</h3>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
            <p>Send headers: X-API-KEY, X-TIMESTAMP, X-NONCE, X-SIGNATURE.</p>
            <p>Signature payload: HMAC_SHA256(apiSecret, timestamp + nonce + body).</p>
            <p>Timestamp must be within 5 minutes, and nonce must be unique during that window.</p>
          </div>
        </div>
        <div className="surface overflow-hidden">
          <div className="border-b border-line bg-slate-50 px-4 py-3 font-bold text-slate-800">Quick Start</div>
          <pre className="overflow-auto bg-slate-950 p-4 text-xs leading-6 text-cyan">{curl}</pre>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <InsightCard title="SDK 示例" text="Node.js / PHP / Java / Python SDK 使用同一套 HMAC 签名规则。">
          <pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-6 text-cyan">{`const client = new FXpay({ apiKey, apiSecret });
await client.payments.create({
  amount: "100.00",
  currency: "USD"
});`}</pre>
        </InsightCard>
        <InsightCard title="HMAC 示例" text="签名内容为 timestamp + nonce + body，避免请求被篡改或重放。">
          <SimpleBars labels={["timestamp", "nonce", "body", "signature"]} />
        </InsightCard>
        <InsightCard title="Webhook 示例" text="支付成功后平台会发送 order.paid 事件，商户需返回 2xx。">
          <pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-6 text-cyan">{`{
  "event": "order.paid",
  "orderNo": "P2026...",
  "status": "PAID"
}`}</pre>
        </InsightCard>
      </div>
    </div>
  );
}
