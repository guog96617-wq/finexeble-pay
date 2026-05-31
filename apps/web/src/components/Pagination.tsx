export function Pagination({ page = 1, totalPages = 1 }: { page?: number; totalPages?: number }) {
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button type="button" className="button secondary px-3 py-2 text-xs" disabled={page <= 1}>
          Previous
        </button>
        <button type="button" className="button secondary px-3 py-2 text-xs" disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
