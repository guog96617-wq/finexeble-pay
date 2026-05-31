"use client";

import clsx from "clsx";

export function Toast({ message, type = "info" }: { message: string; type?: "info" | "success" | "error" }) {
  if (!message) {
    return null;
  }

  return (
    <div className={clsx("rounded-lg border px-3 py-2 text-sm", type === "success" && "border-green-200 bg-green-50 text-green-700", type === "error" && "border-red-200 bg-red-50 text-red-700", type === "info" && "border-blue-200 bg-blue-50 text-blue-700")}>
      {message}
    </div>
  );
}
