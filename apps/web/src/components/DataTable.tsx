export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="surface overflow-hidden">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#0f2745] text-slate-300">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")} className="border-t border-line">
              {row.map((cell) => (
                <td key={cell} className="px-4 py-3 text-slate-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
