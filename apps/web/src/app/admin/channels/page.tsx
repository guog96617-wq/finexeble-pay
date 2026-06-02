import { AdminChannel, AdminChannelManager } from "@/components/AdminPspChannelManager";
import { DashboardShell } from "@/components/DashboardShell";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminChannelsPage() {
  const channels = await apiGet<AdminChannel[]>("/api/admin/channels", []);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Payment Channels" role="Super Admin">
      <AdminChannelManager initialChannels={channels} />
    </DashboardShell>
  );
}
