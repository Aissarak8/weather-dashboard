# Weather Dashboard

A weather dashboard built with plain HTML, CSS, and vanilla JavaScript, using the OpenWeatherMap API.

## Features

- Search current weather by city name
- Today's hourly forecast
- Air conditions (real feel, wind speed, pressure, chance of rain)
- 7-day forecast

## Tech Stack

- HTML5
- CSS3 (custom properties, Flexbox, Grid)
- Vanilla JavaScript
- [OpenWeatherMap API](https://openweathermap.org/api)

## Local setup

1. Clone the repo.
2. Create `config.js` containing `const API_KEY = 'YOUR_API_KEY_HERE';`.
3. Get a free API key from [openweathermap.org/api](https://openweathermap.org/api) and place it in that ignored file.
4. Open `index.html` with a local server (e.g. VS Code's Live Server) and search for a city.

Never commit `config.js`. A browser can read any API key used directly by client-side JavaScript, so the local key mode is not suitable for a public deployment.

## Secure public deployment

The repository includes a Cloudflare Worker proxy in `worker/`. The Worker keeps `OPENWEATHERMAP_API_KEY` in Cloudflare's encrypted secret storage and returns only weather responses to the browser.

1. Authenticate Wrangler: `npx wrangler login`.
2. Store the key securely: `npx wrangler secret put OPENWEATHERMAP_API_KEY`.
3. Deploy the Worker manually: `npm run worker:deploy`.
4. Add the resulting HTTPS Worker URL as the GitHub repository variable `WEATHER_API_BASE_URL`.
5. Enable GitHub Pages with **GitHub Actions** as its source.
6. Run the manual **Deploy Weather Dashboard** workflow.

The workflow is manual so merging code does not deploy automatically. The Worker restricts browser CORS to `https://aissarak8.github.io` and caches successful upstream responses for five minutes. For stronger abuse protection, configure a Cloudflare rate-limiting rule for the Worker route before sharing it broadly.

## Status

Functional - search, current weather, today's hourly forecast, air conditions, and 7-day forecast all work end to end. This is a learning/portfolio project.
