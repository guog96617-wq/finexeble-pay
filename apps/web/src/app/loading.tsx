import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { BrandLogo } from "@/components/BrandLogo";
import { brand } from "@/lib/brand";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5">
      <div className="w-full max-w-sm">
        <div className="surface mb-4 p-5 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo variant="mark" />
          </div>
          <p className="text-lg font-black text-slate-950">{brand.shortName} is loading</p>
          <p className="mt-2 text-sm text-muted">Fetching latest payment data...</p>
        </div>
        <LoadingSkeleton rows={3} />
      </div>
    </main>
  );
}
