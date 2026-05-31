import { Nav } from "@/components/Nav";

export default function PluginsPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">Plugin Marketplace</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-slate-950">Launch merchant integrations faster.</h1>
        <div className="mt-10 grid-fit">
          {["Shopify", "WooCommerce", "Shopline", "Magento", "OpenCart"].map((plugin, index) => (
            <div key={plugin} className="surface p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-black text-slate-950">{plugin}</h2>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${index < 3 ? "bg-green-50 text-success" : "bg-amber-50 text-warn"}`}>
                  {index < 3 ? "Available" : "Coming Soon"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Checkout integration package with API key and webhook setup guide.</p>
              <button className="button secondary mt-5">View guide</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
