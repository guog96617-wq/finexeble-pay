import { DashboardShell } from "@/components/DashboardShell";
import { CreatePspForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Supplier = { id: string; name: string; status: string; apiBaseUrl: string; channels?: { id: string; name: string; status: string }[] };

export default async function AdminPspPage() {
  const suppliers = await apiGet<Supplier[]>("/api/admin/suppliers", []);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="PSP Management" role="Super Admin">
      <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <CreatePspForm />
        <div className="surface overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">PSP</th><th>Status</th><th>API</th><th>Channels</th></tr></thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-t border-line">
                  <td className="p-3 font-bold text-slate-900">{supplier.name}</td>
                  <td>{supplier.status}</td>
                  <td>{supplier.apiBaseUrl}</td>
                  <td>{supplier.channels?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
