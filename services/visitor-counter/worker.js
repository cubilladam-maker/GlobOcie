const jsonHeaders = origin => ({
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "Content-Type, X-Owner-Key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
  "Vary": "Origin"
});

function response(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders(origin) });
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function bodyOf(request) {
  const body = await request.json();
  if (!body.siteId || !body.visitorId || String(body.siteId).length > 80 || String(body.visitorId).length > 160) throw new Error("invalid-body");
  return body;
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const configured = (env.ALLOWED_ORIGIN || "").replace(/\/$/, "");
  return origin === configured || origin === "null" ? origin : configured;
}

function isOwnerRequest(request, env) {
  const provided = request.headers.get("X-Owner-Key") || "";
  return provided.length >= 20 && provided === env.OWNER_KEY;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: jsonHeaders(origin) });
    if ((request.headers.get("Origin") || "") !== origin) return response({ error: "origin" }, 403, origin);

    try {
      if (request.method === "POST" && url.pathname === "/visit") {
        const { siteId, visitorId } = await bodyOf(request);
        const visitorHash = await sha256(`${env.HASH_PEPPER}:${siteId}:${visitorId}`);
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const day = new Date().toISOString().slice(0, 10);
        const ipHash = await sha256(`${env.HASH_PEPPER}:${day}:${ip}`);
        const limit = await env.DB.prepare("SELECT registrations FROM daily_ip_limits WHERE day = ? AND ip_hash = ?").bind(day, ipHash).first();
        if ((limit?.registrations || 0) >= 5) return response({ accepted: false, reason: "daily-limit" }, 429, origin);

        const owner = await env.DB.prepare("SELECT 1 AS yes FROM owner_browsers WHERE site_id = ? AND visitor_hash = ?").bind(siteId, visitorHash).first();
        if (owner) return response({ accepted: false, reason: "owner" }, 200, origin);

        const inserted = await env.DB.prepare("INSERT OR IGNORE INTO visitors (site_id, visitor_hash) VALUES (?, ?)").bind(siteId, visitorHash).run();
        await env.DB.prepare("UPDATE visitors SET last_seen = CURRENT_TIMESTAMP WHERE site_id = ? AND visitor_hash = ?").bind(siteId, visitorHash).run();
        if (inserted.meta.changes > 0) {
          await env.DB.prepare("INSERT INTO daily_ip_limits (day, ip_hash, registrations) VALUES (?, ?, 1) ON CONFLICT(day, ip_hash) DO UPDATE SET registrations = registrations + 1").bind(day, ipHash).run();
        }
        return response({ accepted: true, unique: inserted.meta.changes > 0 }, 200, origin);
      }

      if (request.method === "POST" && url.pathname === "/owner") {
        if (!isOwnerRequest(request, env)) return response({ error: "owner-key" }, 401, origin);
        const { siteId, visitorId } = await bodyOf(request);
        const visitorHash = await sha256(`${env.HASH_PEPPER}:${siteId}:${visitorId}`);
        await env.DB.batch([
          env.DB.prepare("INSERT OR IGNORE INTO owner_browsers (site_id, visitor_hash) VALUES (?, ?)").bind(siteId, visitorHash),
          env.DB.prepare("DELETE FROM visitors WHERE site_id = ? AND visitor_hash = ?").bind(siteId, visitorHash)
        ]);
        return response({ owner: true }, 200, origin);
      }

      if (request.method === "GET" && url.pathname === "/count") {
        if (!isOwnerRequest(request, env)) return response({ error: "owner-key" }, 401, origin);
        const siteId = url.searchParams.get("siteId") || "";
        const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM visitors WHERE site_id = ?").bind(siteId).first();
        return response({ count: Number(row?.count || 0) }, 200, origin);
      }
      return response({ error: "not-found" }, 404, origin);
    } catch (error) {
      return response({ error: error.message === "invalid-body" ? "invalid-body" : "server" }, error.message === "invalid-body" ? 400 : 500, origin);
    }
  }
};
