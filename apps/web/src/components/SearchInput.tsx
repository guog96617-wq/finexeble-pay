"use client";

import { Search } from "lucide-react";

export function SearchInput({ placeholder = "Search", value, onChange }: { placeholder?: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input className="pl-9" placeholder={placeholder} value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} />
    </div>
  );
}
