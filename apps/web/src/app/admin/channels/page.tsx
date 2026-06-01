import { DashboardShell } from "@/components/DashboardShell";
import { ChannelRoleButtons, CreateChannelForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Supplier = { id: string; name: string };
type Channel = { id: string; name: string; paymentMethod: string; currency: string; status: string; isPrimary: boolean; isBackup: boolean; supplier?: Supplier };

export default async function AdminChannelsPage() {
  const [suppliers, channels] = await Promise.all([
    apiGet<Supplier[]>("/api/admin/suppliers", []),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Channel Management" role="Super Admin">
      <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <CreateChannelForm suppliers={suppliers} />
        <div className="surface overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Channel</th><th>PSP</th><th>Method</th><th>Status</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.id} className="border-t border-line">
                  <td className="p-3 font-bold text-slate-900">{channel.name}</td>
                  <td>{channel.supplier?.name ?? "-"}</td>
                  <td>{channel.paymentMethod}</td>
                  <td>{channel.status}</td>
                  <td>{channel.isPrimary ? "Primary" : channel.isBackup ? "Backup" : "-"}</td>
                  <td className="p-3"><ChannelRoleButtons id={channel.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
