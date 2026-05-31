import { Inbox } from "lucide-react";

export function EmptyState({ title = "No data yet", text = "Records will appear here once available." }: { title?: string; text?: string }) {
  return (
    <div className="surface grid place-items-center px-5 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-slate-50 text-muted">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="mt-4 font-black">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
    </div>
  );
}
