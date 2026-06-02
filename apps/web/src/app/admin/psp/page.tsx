import { AdminPspManager } from "@/components/AdminPspChannelManager";
import { DashboardShell } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function AdminPspPage() {
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="PSP Module Removed" role="Super Admin">
      <AdminPspManager />
    </DashboardShell>
  );
}
