import clsx from "clsx";
import { statusTone } from "@/lib/brand";

const toneClass = {
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] ?? "neutral";
  return <span className={clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", toneClass[tone])}>{status}</span>;
}
