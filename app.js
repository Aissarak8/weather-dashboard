const form = document.getElementById('weather-form');
const cityInput = document.getElementById('name_of_city');

form.addEventListener('submit', function (event) {
    // TODO: stop the form from reloading the page (event.preventDefault)

    // TODO: read the city name the user typed (cityInput.value)

    // TODO: call getWeather(city) with that value
});

function getWeather(city) {
    // TODO: build the OpenWeatherMap "current weather" URL using `city` and API_KEY
    // docs: https://openweathermap.org/current#name

    // TODO: fetch() that URL

    // TODO: convert the response to JSON with .json()

    // TODO: call displayWeather(data) with the parsed result

    // TODO: catch and handle errors (bad city name, network failure)
}

function displayWeather(data) {
    // TODO: pull the values you need out of `data` (city name, temperature, etc.)
    // Tip: console.log(data) first to see the actual shape of the response

    // TODO: write them into the DOM:
    //   #city-name span, #temperature span, #chance-of-rain span

    // Later: today-forecast table, air-conditions fields, seven-day-forecast table
}
