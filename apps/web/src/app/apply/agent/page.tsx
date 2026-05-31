import { ApplyForm } from "@/components/ApplyForm";
import { Nav } from "@/components/Nav";

export default function AgentApplyPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="px-5 py-16">
        <p className="text-center text-sm font-bold uppercase tracking-[.18em] text-cyan">Agent Program</p>
        <h1 className="mx-auto mb-8 mt-4 max-w-3xl text-center text-5xl font-black leading-tight text-slate-950">Bring merchants into a modern payment network.</h1>
        <ApplyForm type="Agent" />
      </section>
    </main>
  );
}
