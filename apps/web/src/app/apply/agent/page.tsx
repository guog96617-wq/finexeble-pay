import { ApplyForm } from "@/components/ApplyForm";
import { Nav } from "@/components/Nav";

export default function AgentApplyPage() {
  return (
    <main className="min-h-screen bg-ink">
      <Nav />
      <section className="px-5 py-16">
        <h1 className="mb-8 text-center text-4xl font-black">Agent Application</h1>
        <ApplyForm type="Agent" />
      </section>
    </main>
  );
}
