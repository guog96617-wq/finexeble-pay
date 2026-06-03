"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Toast } from "./Toast";

const LOCAL_WEB_ORIGIN = "http://localhost:3000";

export function checkoutUrlFor(orderNo: string) {
  return `${LOCAL_WEB_ORIGIN}/checkout/${orderNo}`;
}

export function CheckoutLinkActions({
  orderNo,
  showCopy = true,
  showUrl = false,
  showView = true,
}: {
  orderNo: string;
  showCopy?: boolean;
  showUrl?: boolean;
  showView?: boolean;
}) {
  const [message, setMessage] = useState("");
  const checkoutUrl = useMemo(() => checkoutUrlFor(orderNo), [orderNo]);

  async function copy() {
    await navigator.clipboard.writeText(checkoutUrl);
    setMessage("支付链接已复制。");
    window.setTimeout(() => setMessage(""), 1800);
  }

  return (
    <div className="grid gap-2">
      {showUrl ? <span className="max-w-[260px] truncate font-mono text-xs text-slate-500">{checkoutUrl}</span> : null}
      <div className="flex flex-wrap gap-2">
        {showView ? (
          <a className="button secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs" href={checkoutUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} aria-hidden="true" />
            查看收银台
          </a>
        ) : null}
        {showCopy ? (
          <button type="button" className="button secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs" onClick={() => void copy()}>
            <Copy size={14} aria-hidden="true" />
            复制支付链接
          </button>
        ) : null}
      </div>
      {message ? (
        <div className="fixed right-5 top-5 z-50">
          <Toast message={message} type="success" />
        </div>
      ) : null}
    </div>
  );
}
