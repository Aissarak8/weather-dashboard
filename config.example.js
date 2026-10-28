// Production uses the public URL of the secure Worker proxy.
window.WEATHER_CONFIG = {
  apiBaseUrl: "https://YOUR-WORKER.workers.dev",
};

// For local-only development, config.js may instead contain:
// const API_KEY = 'YOUR_API_KEY_HERE';
// config.js is gitignored, so the local key is never committed.
