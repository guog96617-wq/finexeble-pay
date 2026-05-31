import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";

type ApiKey = {
  apiKey: string;
  status: string;
  createdAt: string;
};

export function ApiKeyPanel({ apiKeys }: { apiKeys: ApiKey[] }) {
  return (
    <div className="grid gap-4">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Developer Center</h2>
            <p className="text-sm text-muted">API keys, signature rules and quick start references for merchant integration.</p>
          </div>
          <button type="button" className="button secondary">Copy integration guide</button>
        </div>
        <DataTable columns={["API Key", "Status", "Created", "Secret"]} rows={apiKeys.map((key) => [key.apiKey, <StatusBadge key={key.apiKey} status={key.status} />, new Date(key.createdAt).toLocaleString(), "sk_demo_********"])} />
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
          <pre className="overflow-auto bg-slate-950 p-4 text-xs leading-6 text-cyan">{`POST /api/v1/payments/create
X-API-KEY: pk_demo_global_shop
X-TIMESTAMP: 1760000000000
X-NONCE: unique_nonce
X-SIGNATURE: hmac_sha256(secret, timestamp + nonce + body)

{
  "merchantOrderNo": "M202600001",
  "amount": "100.00",
  "currency": "USD"
}`}</pre>
        </div>
      </div>
    </div>
  );
}
