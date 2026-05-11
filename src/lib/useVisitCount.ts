import { useEffect, useState } from "react";

const STORAGE_KEY = "lc.visited";

/**
 * Fetch the global visit count from /api/visits.
 *
 * On the FIRST visit from a given browser (no `lc.visited` flag in localStorage)
 * the hook POSTs — incrementing the global counter. On subsequent visits it
 * GETs — just reading. This gives a coarse "unique visitor" count with zero
 * tracking: no cookie, no IP storage, no user id. The flag is purely local.
 *
 * Returns `null` until the request resolves, or if the API is unreachable
 * (e.g. in `pnpm dev` where there's no Worker). Components should gracefully
 * render nothing when the count is null.
 */
export function useVisitCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    const method = seen ? "GET" : "POST";
    const controller = new AbortController();

    fetch("/api/visits", { method, signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ count: number }>) : null))
      .then((d) => {
        if (d && typeof d.count === "number") {
          setCount(d.count);
          if (!seen) localStorage.setItem(STORAGE_KEY, "1");
        }
      })
      .catch(() => {
        // Network error, dev environment without Worker, ad-blocker — silently
        // render nothing rather than show a broken state.
      });

    return () => controller.abort();
  }, []);

  return count;
}
