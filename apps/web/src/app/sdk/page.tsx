import { Nav } from "@/components/Nav";

export default function SdkPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-black">SDK Center</h1>
        <div className="mt-8 grid-fit">
          {[
            ["PHP SDK", "payhub/payhub-php"],
            ["Node.js SDK", "@payhub/sdk"],
            ["Java SDK", "com.payhub:sdk"],
            ["Python SDK", "payhub-sdk"],
          ].map(([title, pkg]) => (
            <div key={title} className="surface p-5">
              <h2 className="font-black">{title}</h2>
              <p className="mt-2 text-sm text-cyan">{pkg}</p>
              <button className="mt-5">Download</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
