import {
  formatLocalDate,
  getDateKey,
  groupForecastByDay,
  roundTemperature,
} from "./weather-utils.js";

const form = document.getElementById("weather-form");
const cityInput = document.getElementById("name_of_city");
const searchButton = document.getElementById("search-btn");
const dashboard = document.getElementById("weather-content");
const statusMessage = document.getElementById("status-message");
const unitButtons = [...document.querySelectorAll(".unit-button")];

let unit = getStoredValue("weather-unit") || "c";
let weatherState = null;
let activeRequest = null;

const metricIcons = {
  humidity:
    '<svg viewBox="0 0 24 24"><path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z"></path><path d="M9 15.5a3.2 3.2 0 0 0 3 1.8"></path></svg>',
  wind: '<svg viewBox="0 0 24 24"><path d="M3 8h11a3 3 0 1 0-3-3"></path><path d="M3 12h16a2.5 2.5 0 1 1-2.5 2.5"></path><path d="M3 16h7"></path></svg>',
  pressure:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="m12 12 3.5-3.5"></path><path d="M8 17h8"></path></svg>',
  visibility:
    '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>',
  clouds:
    '<svg viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.2 9.2 4.5 4.5 0 0 0 7 18Z"></path></svg>',
  feels:
    '<svg viewBox="0 0 24 24"><path d="M9 14.8V5a3 3 0 0 1 6 0v9.8a5 5 0 1 1-6 0Z"></path><path d="M12 7v9"></path></svg>',
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city) loadWeather(city);
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    unit = button.dataset.unit;
    setStoredValue("weather-unit", unit);
    updateUnitButtons();
    if (weatherState)
      renderWeather(weatherState.current, weatherState.forecast);
  });
});

function getApiUrl(endpoint, city) {
  const proxyBaseUrl = window.WEATHER_CONFIG?.apiBaseUrl?.replace(/\/$/, "");
  if (proxyBaseUrl) {
    return `${proxyBaseUrl}/${endpoint}?city=${encodeURIComponent(city)}`;
  }
  if (
    typeof API_KEY !== "undefined" &&
    API_KEY &&
    API_KEY !== "YOUR_API_KEY_HERE"
  ) {
    const params = `q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    return `https://api.openweathermap.org/data/2.5/${endpoint}?${params}`;
  }
  throw new Error("Weather API is not configured.");
}

async function loadWeather(city) {
  activeRequest?.abort();
  activeRequest = new AbortController();
  setLoading(true, `Loading weather for ${city}…`);
  try {
    const responses = await Promise.all([
      fetch(getApiUrl("weather", city), { signal: activeRequest.signal }),
      fetch(getApiUrl("forecast", city), { signal: activeRequest.signal }),
    ]);
    const [current, forecast] = await Promise.all(responses.map(parseResponse));
    weatherState = { current, forecast };
    cityInput.value = "";
    setStoredValue("weather-city", current.name);
    renderWeather(current, forecast);
    showStatus(`Weather updated for ${current.name}.`, false, 1800);
  } catch (error) {
    if (error.name !== "AbortError") showStatus(error.message, true);
  } finally {
    setLoading(false);
  }
}

async function parseResponse(response) {
  if (response.ok) return response.json();
  let message = "Weather service is temporarily unavailable.";
  try {
    const data = await response.json();
    if (typeof data.message === "string") message = data.message;
    if (typeof data.error === "string") message = data.error;
  } catch {
    // Keep the friendly fallback when the response is not JSON.
  }
  if (response.status === 404) {
    message = "City not found. Check the spelling and try again.";
  }
  if (response.status === 429) {
    message = "Too many searches. Please wait a minute and try again.";
  }
  throw new Error(message);
}

function renderWeather(current, forecast) {
  const timezone = forecast.city?.timezone ?? current.timezone ?? 0;
  const days = groupForecastByDay(forecast.list, timezone);
  const todayKey = getDateKey(current.dt, timezone);
  const today = days.find((day) => day.key === todayKey);
  const condition = current.weather[0];

  text("current-location", `${current.name}, ${current.sys.country}`);
  text("weather-description", condition.description);
  document.getElementById("current-temperature").innerHTML =
    `${temperature(current.main.temp)}<span>°</span>`;
  text("hero-feels-like", `${temperature(current.main.feels_like)}°`);
  text("today-high", `${temperature(today?.max ?? current.main.temp_max)}°`);
  text("today-low", `${temperature(today?.min ?? current.main.temp_min)}°`);
  text(
    "local-time",
    formatLocalDate(current.dt, timezone, {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
    }),
  );
  text(
    "rain-summary",
    `Precipitation ${Math.round((forecast.list[0]?.pop || 0) * 100)}%`,
  );
  text(
    "updated-time",
    `Updated ${formatLocalDate(current.dt, timezone, { hour: "numeric", minute: "2-digit" })}`,
  );

  const icon = document.getElementById("current-weather-icon");
  icon.src = iconUrl(condition.icon, "4x");
  icon.alt = condition.description;
  renderHourly(forecast.list.slice(0, 8), timezone);
  renderConditions(current);
  renderOutlook(days, timezone);
  dashboard.setAttribute("aria-busy", "false");
}

function renderHourly(slots, timezone) {
  const values = slots.map((slot) => roundTemperature(slot.main.temp, unit));
  const width = 620;
  const height = 150;
  const padding = { x: 28, top: 28, bottom: 32 };
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => ({
    x: padding.x + (index * (width - padding.x * 2)) / (values.length - 1),
    y:
      padding.top +
      ((max - value) / range) * (height - padding.top - padding.bottom),
    value,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${points[0].x},${height - padding.bottom} ${line} ${points.at(-1).x},${height - padding.bottom}`;
  const labels = points
    .map((point, index) => {
      const time = formatLocalDate(slots[index].dt, timezone, {
        hour: "numeric",
      });
      return `<g class="chart-point" tabindex="0" role="graphics-symbol" aria-label="${time}, ${point.value} degrees"><text class="chart-temp" x="${point.x}" y="${point.y - 12}" text-anchor="middle">${point.value}°</text><circle class="chart-hit-area" cx="${point.x}" cy="${point.y}" r="13"></circle><circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="4"></circle><text class="chart-label" x="${point.x}" y="${height - 6}" text-anchor="middle">${time}</text></g>`;
    })
    .join("");
  const description = values
    .map(
      (value, index) =>
        `${formatLocalDate(slots[index].dt, timezone, { hour: "numeric" })}: ${value} degrees`,
    )
    .join(", ");

  document.getElementById("hourly-chart").innerHTML =
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-description"><title id="chart-title">Temperature for the next 24 hours</title><desc id="chart-description">${description}</desc><defs><linearGradient id="temperature-gradient"><stop stop-color="#67d9ed"/><stop offset="1" stop-color="#6f8cff"/></linearGradient><linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#67d9ed" stop-opacity=".22"/><stop offset="1" stop-color="#67d9ed" stop-opacity="0"/></linearGradient></defs><line class="chart-grid" x1="${padding.x}" y1="${height - padding.bottom}" x2="${width - padding.x}" y2="${height - padding.bottom}"></line><polygon class="chart-area" points="${area}"></polygon><polyline class="chart-line" points="${line}"></polyline>${labels}</svg>`;
  text("hourly-summary", `${Math.min(...values)}° — ${Math.max(...values)}°`);
  document
    .getElementById("hourly-details")
    .replaceChildren(...slots.map((slot) => createHourlyItem(slot, timezone)));
}

function createHourlyItem(slot, timezone) {
  const item = document.createElement("div");
  item.className = "hourly-item";
  const time = document.createElement("span");
  time.textContent = formatLocalDate(slot.dt, timezone, { hour: "numeric" });
  const image = document.createElement("img");
  image.src = iconUrl(slot.weather[0].icon);
  image.alt = slot.weather[0].description;
  image.loading = "lazy";
  const rain = document.createElement("strong");
  rain.textContent = `${Math.round((slot.pop || 0) * 100)}%`;
  item.append(time, image, rain);
  return item;
}

function renderConditions(current) {
  const metrics = [
    ["humidity", "Humidity", current.main.humidity, "%"],
    [
      "wind",
      "Wind",
      current.wind?.speed,
      "km/h",
      (value) => Math.round(value * 3.6),
    ],
    ["pressure", "Pressure", current.main.pressure, "hPa"],
    [
      "visibility",
      "Visibility",
      current.visibility,
      "km",
      (value) => (value / 1000).toFixed(1),
    ],
    ["clouds", "Cloud cover", current.clouds?.all, "%"],
    ["feels", "Feels like", current.main.feels_like, "°", temperature],
  ].filter((metric) => Number.isFinite(metric[2]));
  document.getElementById("conditions-grid").innerHTML = metrics
    .map(
      ([key, label, value, suffix, transform]) =>
        `<div class="condition-card"><span class="condition-icon" aria-hidden="true">${metricIcons[key]}</span><dt>${label}</dt><dd>${transform ? transform(value) : Math.round(value)}${suffix}</dd></div>`,
    )
    .join("");
}

function renderOutlook(days, timezone) {
  document
    .getElementById("forecast-list")
    .replaceChildren(
      ...days.map((day, index) => createForecastRow(day, timezone, index)),
    );
  if (days.length) {
    const first = formatLocalDate(days[0].representative.dt, timezone, {
      month: "short",
      day: "numeric",
    });
    const last = formatLocalDate(days.at(-1).representative.dt, timezone, {
      month: "short",
      day: "numeric",
    });
    text("forecast-range", `${first} – ${last}`);
  }
}

function createForecastRow(day, timezone, index) {
  const slot = day.representative;
  const row = document.createElement("article");
  row.className = "forecast-row";
  const dayName =
    index === 0
      ? "Today"
      : formatLocalDate(slot.dt, timezone, { weekday: "short" });
  const date = formatLocalDate(slot.dt, timezone, {
    month: "short",
    day: "numeric",
  });
  row.innerHTML = `<div class="forecast-day"><strong>${dayName}</strong><span>${date}</span></div><img class="forecast-icon" src="${iconUrl(slot.weather[0].icon)}" alt="${slot.weather[0].description}" loading="lazy"><span class="forecast-condition">${slot.weather[0].description}</span><span class="forecast-temperature">${temperature(day.max)}° <span>/ ${temperature(day.min)}°</span></span>`;
  return row;
}

function setLoading(loading, message = "") {
  searchButton.disabled = loading;
  searchButton.classList.toggle("is-loading", loading);
  dashboard.setAttribute("aria-busy", String(loading));
  if (loading) showStatus(message);
}

function showStatus(message, isError = false, timeout = 0) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
  statusMessage.classList.add("is-visible");
  window.clearTimeout(showStatus.timer);
  if (timeout) {
    showStatus.timer = window.setTimeout(
      () => statusMessage.classList.remove("is-visible"),
      timeout,
    );
  }
}

function text(id, value) {
  document.getElementById(id).textContent = value;
}

function temperature(value) {
  return roundTemperature(value, unit);
}

function iconUrl(code, size = "2x") {
  return `https://openweathermap.org/img/wn/${code}@${size}.png`;
}

function updateUnitButtons() {
  unitButtons.forEach((button) => {
    const active = button.dataset.unit === unit;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function getStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in privacy modes.
  }
}

updateUnitButtons();
loadWeather(getStoredValue("weather-city") || "Marrakesh");
