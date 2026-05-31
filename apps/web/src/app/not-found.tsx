import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5">
      <div className="surface w-full max-w-lg p-8 text-center">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[.18em] text-cyan">404</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted">The page may have moved, or the demo route has not been enabled yet.</p>
        <Link href="/" className="button mt-6">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
