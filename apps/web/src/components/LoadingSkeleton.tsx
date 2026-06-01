export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="surface grid gap-3 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
