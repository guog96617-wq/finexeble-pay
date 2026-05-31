import clsx from "clsx";

export function MetricCard({ label, value, tone = "brand" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="surface p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={clsx("mt-2 text-2xl font-black", tone === "success" && "text-success", tone === "cyan" && "text-cyan", tone === "warn" && "text-warn", tone === "brand" && "text-white")}>
        {value}
      </p>
    </div>
  );
}
