import { AdminPspManager, AdminSupplier } from "@/components/AdminPspChannelManager";
import { DashboardShell } from "@/components/DashboardShell";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminPspPage() {
  const suppliers = await apiGet<AdminSupplier[]>("/api/admin/psp", []);

  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="PSP 管理" role="Super Admin">
      <AdminPspManager initialSuppliers={suppliers} />
    </DashboardShell>
  );
}
