import { Nav } from "@/components/Nav";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-black">Contact Us</h1>
        <div className="surface mt-8 grid gap-4 p-5">
          <input placeholder="Name" />
          <input placeholder="Email" />
          <textarea placeholder="Tell us about your payment needs" rows={6} />
          <button>Send message</button>
        </div>
      </section>
    </main>
  );
}
