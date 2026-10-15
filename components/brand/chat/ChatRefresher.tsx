"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** New messages arrive by asking again: the page refreshes every few seconds while it's in view. */
export function ChatRefresher({ every = 10_000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => clearInterval(timer);
  }, [router, every]);
  return null;
}
