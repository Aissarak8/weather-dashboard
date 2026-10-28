const ENDPOINTS = new Set(["weather", "forecast"]);

function getCorsHeaders(origin, allowedOrigin) {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
  if (!origin || origin === allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }
  return headers;
}

export default {
  async fetch(request, env, ctx) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("Origin");
    const corsHeaders = getCorsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed." }, 405, corsHeaders);
    }

    const endpoint = requestUrl.pathname.replace(/^\/+|\/+$/g, "");
    if (!ENDPOINTS.has(endpoint)) {
      return json({ error: "Not found." }, 404, corsHeaders);
    }

    if (origin && origin !== env.ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed." }, 403, corsHeaders);
    }

    const city = requestUrl.searchParams.get("city")?.trim();
    if (!city || city.length > 100) {
      return json({ error: "Enter a valid city name." }, 400, corsHeaders);
    }

    if (!env.WEATHER_RATE_LIMITER) {
      return json(
        { error: "Weather service protection is not configured." },
        503,
        corsHeaders,
      );
    }

    const clientAddress = request.headers.get("CF-Connecting-IP") || "unknown";
    const rateLimit = await env.WEATHER_RATE_LIMITER.limit({
      key: `${endpoint}:${clientAddress}`,
    });
    if (!rateLimit.success) {
      return json(
        { error: "Too many requests. Try again in a minute." },
        429,
        corsHeaders,
        { "Retry-After": "60" },
      );
    }

    if (!env.OPENWEATHERMAP_API_KEY) {
      return json(
        { error: "Weather service is not configured." },
        503,
        corsHeaders,
      );
    }

    const upstreamUrl = new URL(
      `https://api.openweathermap.org/data/2.5/${endpoint}`,
    );
    upstreamUrl.searchParams.set("q", city);
    upstreamUrl.searchParams.set("appid", env.OPENWEATHERMAP_API_KEY);
    upstreamUrl.searchParams.set("units", "metric");

    const cacheKey = new Request(requestUrl.toString(), request);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      return withCors(cached, corsHeaders);
    }

    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
    });
    const body = await upstream.text();
    const response = new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": upstream.ok ? "public, max-age=300" : "no-store",
      },
    });

    if (upstream.ok) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return withCors(response, corsHeaders);
  },
};

function withCors(response, corsHeaders) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([name, value]) =>
    headers.set(name, value),
  );
  return new Response(response.body, { status: response.status, headers });
}

function json(data, status, corsHeaders, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
