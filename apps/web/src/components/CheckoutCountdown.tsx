"use client";

import { useEffect, useState } from "react";

export function CheckoutCountdown({ initialSeconds = 15 * 60 }: { initialSeconds?: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
}
