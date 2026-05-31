import { Nav } from "@/components/Nav";

export default function SdkPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">SDK Center</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-slate-950">Starter SDK packages for merchant developers.</h1>
        <div className="mt-10 grid-fit">
          {[
            ["PHP SDK", "finexeble/fxpay-php"],
            ["Node.js SDK", "@finexeble/fxpay"],
            ["Java SDK", "com.finexeble:fxpay-sdk"],
            ["Python SDK", "fxpay-sdk"],
          ].map(([title, pkg]) => (
            <div key={title} className="surface p-5">
              <h2 className="font-black text-slate-950">{title}</h2>
              <p className="mt-2 font-mono text-sm text-cyan">{pkg}</p>
              <button className="button secondary mt-5">View docs</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
