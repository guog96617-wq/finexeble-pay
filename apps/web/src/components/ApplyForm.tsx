export function ApplyForm({ type }: { type: "Merchant" | "Agent" }) {
  return (
    <form className="surface mx-auto grid max-w-2xl gap-4 p-5">
      <div>
        <label className="text-sm font-semibold text-slate-700">{type === "Merchant" ? "Company name" : "Company / team name"}</label>
        <input placeholder={`${type} legal name`} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700">Contact name</label>
          <input placeholder="Jane Lee" />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input placeholder="ops@example.com" type="email" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">Country</label>
        <input placeholder="Hong Kong, Singapore, United States..." />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">Website or business profile</label>
        <input placeholder="https://example.com" />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">{type === "Merchant" ? "Monthly transaction volume" : "Merchant resources"}</label>
        <textarea placeholder={type === "Merchant" ? "Tell us about payment needs and expected volume" : "Tell us about your merchant network"} rows={4} />
      </div>
      <button type="button">Submit application</button>
    </form>
  );
}
