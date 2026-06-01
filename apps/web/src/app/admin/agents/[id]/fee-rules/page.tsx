import { DashboardShell } from "@/components/DashboardShell";
import { AgentFeeRuleForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Channel = { id: string; name: string };

export default async function AdminAgentFeeRulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channels = await apiGet<Channel[]>("/api/admin/channels", []);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Agent Fee Rules" role="Super Admin">
      <section className="grid gap-4">
        <AgentFeeRuleForm agentId={id} channelIds={channels.map((channel) => channel.id)} />
        <div className="surface p-4 text-sm text-muted">Agent ID: {id}. Allowed channels are currently all listed platform channels.</div>
      </section>
    </DashboardShell>
  );
}
