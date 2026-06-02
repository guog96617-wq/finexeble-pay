import { AdminChannel, AdminChannelManager, AdminSupplier } from "@/components/AdminPspChannelManager";
import { DashboardShell } from "@/components/DashboardShell";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminChannelsPage() {
  const [suppliers, channels] = await Promise.all([
    apiGet<AdminSupplier[]>("/api/admin/psp", []),
    apiGet<AdminChannel[]>("/api/admin/channels", []),
  ]);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="支付通道管理" role="Super Admin">
      <AdminChannelManager initialSuppliers={suppliers} initialChannels={channels} />
    </DashboardShell>
  );
}
