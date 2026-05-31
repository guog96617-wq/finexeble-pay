"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5">
      <div className="surface w-full max-w-lg p-5">
        <p className="text-lg font-black text-slate-950">Operation failed</p>
        <p className="mt-2 text-sm text-slate-600">Please try again later or contact the administrator.</p>
        <button className="mt-5" type="button" onClick={reset}>
          Retry
        </button>
      </div>
    </main>
  );
}
