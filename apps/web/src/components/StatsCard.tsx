import clsx from "clsx";

export function StatsCard({ label, value, tone = "brand", caption }: { label: string; value: string; tone?: string; caption?: string }) {
  return (
    <div className="group rounded-card border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className={clsx("mt-1 h-2.5 w-2.5 rounded-full", tone === "success" && "bg-success", tone === "cyan" && "bg-cyan", tone === "warn" && "bg-warn", tone === "danger" && "bg-danger", tone === "brand" && "bg-brand")} />
      </div>
      <p className={clsx("mt-3 text-3xl font-black", tone === "success" && "text-success", tone === "cyan" && "text-cyan", tone === "warn" && "text-warn", tone === "danger" && "text-danger", tone === "brand" && "text-slate-950")}>
        {value}
      </p>
      <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{caption ?? "Live demo"}</p>
    </div>
  );
}
