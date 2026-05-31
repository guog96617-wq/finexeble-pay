export function ApplyForm({ type }: { type: "Merchant" | "Agent" }) {
  return (
    <form className="surface mx-auto grid max-w-2xl gap-4 p-5">
      <div>
        <label className="text-sm text-slate-300">{type} name</label>
        <input placeholder={`${type} legal name`} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-slate-300">Contact name</label>
          <input placeholder="Jane Lee" />
        </div>
        <div>
          <label className="text-sm text-slate-300">Email</label>
          <input placeholder="ops@example.com" type="email" />
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-300">Website or business profile</label>
        <input placeholder="https://example.com" />
      </div>
      <button type="button">Submit application</button>
    </form>
  );
}
