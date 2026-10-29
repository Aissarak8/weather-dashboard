import { formatLocalDate, roundTemperature } from "./weather-utils.js";

const form = document.getElementById("weather-form");
const cityInput = document.getElementById("name_of_city");
const dashboard = document.getElementById("weather-content");
const statusMessage = document.getElementById("status-message");
const unitButtons = [...document.querySelectorAll(".unit-button")];

let unit = "c";
let currentWeather = null;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city) loadCurrentWeather(city);
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    unit = button.dataset.unit;
    unitButtons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    if (currentWeather) renderCurrentWeather(currentWeather);
  });
});

async function loadCurrentWeather(city) {
  setStatus(`Loading weather for ${city}…`);
  dashboard.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(getApiUrl("weather", city));
    currentWeather = await parseResponse(response);
    renderCurrentWeather(currentWeather);
    setStatus(`Weather updated for ${currentWeather.name}.`, false, 1600);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    dashboard.setAttribute("aria-busy", "false");
  }
}

function renderCurrentWeather(data) {
  const condition = data.weather[0];
  const temperature = (value) => roundTemperature(value, unit);
  document.getElementById("current-location").textContent =
    `${data.name}, ${data.sys.country}`;
  document.getElementById("weather-description").textContent =
    condition.description;
  document.getElementById("current-temperature").innerHTML =
    `${temperature(data.main.temp)}<span>°</span>`;
  document.getElementById("hero-feels-like").textContent =
    `${temperature(data.main.feels_like)}°`;
  document.getElementById("today-high").textContent =
    `${temperature(data.main.temp_max)}°`;
  document.getElementById("today-low").textContent =
    `${temperature(data.main.temp_min)}°`;
  document.getElementById("local-time").textContent = formatLocalDate(
    data.dt,
    data.timezone,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
  document.getElementById("updated-time").textContent =
    `Updated ${formatLocalDate(data.dt, data.timezone, { hour: "numeric", minute: "2-digit" })}`;
  const icon = document.getElementById("current-weather-icon");
  icon.src = `https://openweathermap.org/img/wn/${condition.icon}@4x.png`;
  icon.alt = condition.description;
}

function getApiUrl(endpoint, city) {
  const baseUrl = window.WEATHER_CONFIG?.apiBaseUrl?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("Weather API is not configured.");
  return `${baseUrl}/${endpoint}?city=${encodeURIComponent(city)}`;
}

async function parseResponse(response) {
  if (response.ok) return response.json();
  if (response.status === 404)
    throw new Error("City not found. Check the spelling and try again.");
  if (response.status === 429)
    throw new Error("Too many searches. Please wait a minute and try again.");
  throw new Error("Weather service is temporarily unavailable.");
}

function setStatus(message, isError = false, timeout = 0) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
  statusMessage.classList.add("is-visible");
  window.clearTimeout(setStatus.timer);
  if (timeout)
    setStatus.timer = window.setTimeout(
      () => statusMessage.classList.remove("is-visible"),
      timeout,
    );
}

loadCurrentWeather("Marrakesh");
