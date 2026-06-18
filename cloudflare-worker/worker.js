// Cloudflare Worker — Hacky Sack preorder counter
//
// Required bindings (set in Cloudflare dashboard → Worker → Settings):
//   HACKYSACK_KV   Workers KV namespace — stores the current counts
//
// Optional bindings:
//   RESET_SECRET   Plain-text variable — bearer for POST /reset
//
// Endpoints:
//   GET  /         → { left8, left32, max8, max32 }
//   POST /         → body { style: "8panel"|"32panel", qty: number }
//                    Decrements and returns new counts (409 if sold out).
//   POST /reset    → resets counts to max (requires Authorization: Bearer <RESET_SECRET>)

const MAX_8  = 45;
const MAX_32 = 45;
const KEY    = 'counts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json', ...CORS },
});

async function getCounts(env) {
  try {
    const raw = await env.HACKYSACK_KV.get(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        left8:  Math.max(0, Math.min(MAX_8,  parseInt(parsed.left8,  10) || 0)),
        left32: Math.max(0, Math.min(MAX_32, parseInt(parsed.left32, 10) || 0)),
      };
    }
  } catch (e) {}
  return { left8: MAX_8, left32: MAX_32 };
}

async function setCounts(env, counts) {
  await env.HACKYSACK_KV.put(KEY, JSON.stringify(counts));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === '/reset' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      if (!env.RESET_SECRET || auth !== `Bearer ${env.RESET_SECRET}`) {
        return json({ error: 'unauthorized' }, 401);
      }
      const fresh = { left8: MAX_8, left32: MAX_32 };
      await setCounts(env, fresh);
      return json({ ok: true, ...fresh, max8: MAX_8, max32: MAX_32 });
    }

    if (request.method === 'GET') {
      const c = await getCounts(env);
      return json({ ...c, max8: MAX_8, max32: MAX_32 });
    }

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'bad_json' }, 400); }

      const style = body.style;
      const qty   = Math.max(1, Math.min(MAX_8, parseInt(body.qty, 10) || 0));
      if (style !== '8panel' && style !== '32panel') {
        return json({ error: 'bad_style' }, 400);
      }
      if (!qty) return json({ error: 'bad_qty' }, 400);

      const counts = await getCounts(env);
      const key = style === '8panel' ? 'left8' : 'left32';
      if (counts[key] < qty) {
        return json({ error: 'sold_out', ...counts, max8: MAX_8, max32: MAX_32 }, 409);
      }
      counts[key] -= qty;
      await setCounts(env, counts);
      return json({ ok: true, ...counts, max8: MAX_8, max32: MAX_32 });
    }

    return json({ error: 'method_not_allowed' }, 405);
  },
};
