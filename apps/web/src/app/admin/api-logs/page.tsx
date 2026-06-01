import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Config = { configKey: string; configValue: string; description?: string | null };

export default async function AdminApiLogsPage() {
  const configs = await apiGet<Config[]>("/api/admin/system-configs", []);
  const rateLimit = configs.find((item) => item.configKey === "security.rate_limit")?.configValue ?? "100/minute";

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="API Logs" role="Super Admin">
      <SectionHeader
        eyebrow="开发者中心"
        title="API 日志"
        text="当前版本尚未持久化 API 请求日志。本页保留开发者运营入口，并展示签名规则、速率限制和文档跳转。"
        status="PENDING"
        action={<Link href="/docs/api" className="button">打开 API 文档</Link>}
      />
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">签名规则</h3>
          <p className="mt-2 text-sm text-slate-700">请求头：`X-API-KEY`、`X-TIMESTAMP`、`X-NONCE`、`X-SIGNATURE`。</p>
        </div>
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">Rate Limit</h3>
          <p className="mt-2 text-sm text-slate-700">当前默认限流：{rateLimit}</p>
        </div>
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">状态说明</h3>
          <p className="mt-2 text-sm text-slate-700">如需真实 API 请求日志，需要后续单独增加持久化和检索能力。</p>
        </div>
      </section>
      <section className="mt-8">
        <EmptyState title="当前没有可展示的 API 请求日志" text="这不是异常，而是当前版本尚未记录 API 调用明细。" />
      </section>
    </DashboardShell>
  );
}
