const form = document.getElementById("weather-form");
const statusMessage = document.getElementById("status-message");
const dashboard = document.getElementById("weather-content");

dashboard.setAttribute("aria-busy", "false");
statusMessage.textContent = "Search for a city to explore current weather.";
statusMessage.classList.add("is-visible");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  statusMessage.textContent = "Weather details are loading…";
});
