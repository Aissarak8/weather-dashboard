import assert from "node:assert/strict";
import test from "node:test";

import worker from "../worker/src/index.js";

const env = {
  ALLOWED_ORIGIN: "https://aissarak8.github.io",
  OPENWEATHERMAP_API_KEY: "test-secret-key",
  WEATHER_RATE_LIMITER: {
    async limit() {
      return { success: true };
    },
  },
};

function createContext() {
  return { waitUntil() {} };
}

test.beforeEach(() => {
  globalThis.caches = {
    default: {
      async match() {
        return undefined;
      },
      async put() {},
    },
  };
});

test("rejects requests from another browser origin", async () => {
  const request = new Request("https://worker.example/weather?city=Marrakesh", {
    headers: { Origin: "https://example.com" },
  });
  const response = await worker.fetch(request, env, createContext());
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("keeps the API key upstream and returns weather JSON", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamUrl;
  globalThis.fetch = async (url) => {
    upstreamUrl = new URL(url);
    return Response.json({ name: "Marrakesh", main: { temp: 29 } });
  };

  try {
    const request = new Request(
      "https://worker.example/weather?city=Marrakesh",
      {
        headers: { Origin: env.ALLOWED_ORIGIN },
      },
    );
    const response = await worker.fetch(request, env, createContext());
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("Access-Control-Allow-Origin"),
      env.ALLOWED_ORIGIN,
    );
    assert.equal(
      upstreamUrl.searchParams.get("appid"),
      env.OPENWEATHERMAP_API_KEY,
    );
    assert.equal((await response.json()).name, "Marrakesh");
    assert.equal(response.headers.get("OPENWEATHERMAP_API_KEY"), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("stops rate-limited requests before contacting OpenWeatherMap", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamCalled = false;
  globalThis.fetch = async () => {
    upstreamCalled = true;
    return Response.json({});
  };

  try {
    const request = new Request(
      "https://worker.example/weather?city=Marrakesh",
      {
        headers: {
          Origin: env.ALLOWED_ORIGIN,
          "CF-Connecting-IP": "192.0.2.1",
        },
      },
    );
    const response = await worker.fetch(
      request,
      {
        ...env,
        WEATHER_RATE_LIMITER: {
          async limit({ key }) {
            assert.equal(key, "weather:192.0.2.1");
            return { success: false };
          },
        },
      },
      createContext(),
    );

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.equal(upstreamCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
