// cw-metar — CORS + edge-cache proxy for the NOAA Aviation Weather Center API.
// aviationweather.gov serves no Access-Control-Allow-Origin header, so the
// Comfort Weather app (pure client-side) can't call it directly. This worker
// re-serves two read-only endpoints with CORS and a 5-minute edge cache.
// Param whitelist keeps it from being a general-purpose open proxy.

const UPSTREAM = 'https://aviationweather.gov/api/data';
const ROUTES = { '/metar': 'metar', '/stations': 'stationinfo' };
const ALLOWED_PARAMS = ['ids', 'bbox', 'hours'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405);

    const url = new URL(req.url);
    const endpoint = ROUTES[url.pathname];
    if (!endpoint) return json({ error: 'Not found. Routes: /metar, /stations' }, 404);

    const qs = new URLSearchParams({ format: 'json' });
    for (const p of ALLOWED_PARAMS) {
      const v = url.searchParams.get(p);
      if (v != null && v.length <= 200) qs.set(p, v);
    }
    if (!qs.has('ids') && !qs.has('bbox')) return json({ error: 'ids or bbox required' }, 400);

    try {
      const r = await fetch(`${UPSTREAM}/${endpoint}?${qs}`, {
        headers: { 'User-Agent': 'comfort-weather (weather.nathanclendenin.com)' },
        cf: { cacheTtl: 300, cacheEverything: true },
      });
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: {
          ...CORS,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (e) {
      return json({ error: 'Upstream unavailable' }, 502);
    }
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
