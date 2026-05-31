import { Nav } from "@/components/Nav";

export default function PluginsPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-black">Plugin Marketplace</h1>
        <div className="mt-8 grid-fit">
          {["Shopify", "WooCommerce", "Shopline", "Magento", "OpenCart"].map((plugin) => (
            <div key={plugin} className="surface p-5">
              <h2 className="font-black">{plugin}</h2>
              <p className="mt-2 text-sm text-slate-300">Starter checkout integration package with API key and webhook setup guide.</p>
              <button className="mt-5">Download v1.1.0</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
