/**
 * Cloudflare Worker entry for livret-citoyen.
 *
 * The Worker primarily serves the Vite-built static assets in /dist (via the
 * ASSETS binding). It also exposes a single API endpoint:
 *
 *     GET  /api/visits  → returns { count }
 *     POST /api/visits  → increments and returns { count }
 *
 * Backed by a single Durable Object (VisitCounter) so the count is globally
 * shared and persists across deploys. The Worker stores ONLY a single integer —
 * no IPs, no user IDs, no cookies. First-time visitors POST; returning visitors
 * (detected client-side via a `lc.visited` localStorage flag) GET. This gives
 * a coarse "unique visitor" count without any tracking.
 */

export interface Env {
  ASSETS: Fetcher;
  VISITS: DurableObjectNamespace;
}

/** Single-instance Durable Object that owns the global visit counter. */
export class VisitCounter implements DurableObject {
  private state: DurableObjectState;
  constructor(state: DurableObjectState) {
    this.state = state;
  }
  async fetch(req: Request): Promise<Response> {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    };
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    let count = (await this.state.storage.get<number>("count")) ?? 0;
    if (req.method === "POST") {
      count += 1;
      await this.state.storage.put("count", count);
    }
    return new Response(JSON.stringify({ count }), { headers: cors });
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/api/visits") {
      const id = env.VISITS.idFromName("global");
      const stub = env.VISITS.get(id);
      return stub.fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
