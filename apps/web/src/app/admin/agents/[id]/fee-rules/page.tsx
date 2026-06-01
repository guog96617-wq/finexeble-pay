import { DashboardShell } from "@/components/DashboardShell";
import { AgentFeeRuleForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Channel = { id: string; name: string };

export default async function AdminAgentFeeRulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channels = await apiGet<Channel[]>("/api/admin/channels", []);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="代理费率权限" role="Super Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-950">代理费率权限</h2>
        <p className="mt-2 text-sm text-muted">平台给代理设置最低费率。代理给商户设置费率时，不能低于这里的费率。</p>
      </div>
      <section className="grid gap-4">
        <AgentFeeRuleForm agentId={id} channelIds={channels.map((channel) => channel.id)} />
        <div className="surface p-5">
          <h3 className="font-black text-slate-950">示例说明</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">例如：平台设置代理最低商户费率为 10%，代理给商户设置 10% 或 12% 可以，设置 9% 会失败。</p>
          <p className="mt-2 text-xs text-muted">Agent ID: {id}。当前可管理通道默认包含平台已有 {channels.length} 个通道。</p>
        </div>
      </section>
    </DashboardShell>
  );
}
