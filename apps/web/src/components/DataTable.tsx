import { EmptyState } from "./EmptyState";

export function DataTable({ columns, rows, empty = "No records found." }: { columns: string[]; rows: React.ReactNode[][]; empty?: string }) {
  if (rows.length === 0) {
    return <EmptyState title={empty} text="Try adjusting filters or create a new record from the action panel." />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="bg-slate-50/90 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-3 font-bold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.map(String).join("-")} className="border-t border-line transition hover:bg-blue-50/40">
              {row.map((cell, index) => (
              <td key={`${index}-${String(cell)}`} className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
