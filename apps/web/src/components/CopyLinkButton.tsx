"use client";

import { useState } from "react";

export function CopyLinkButton({ value, label = "复制链接" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const absoluteValue = value.startsWith("/") ? `${window.location.origin}${value}` : value;
      await navigator.clipboard.writeText(absoluteValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => void copy()}>
      {copied ? "已复制" : label}
    </button>
  );
}
