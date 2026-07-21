const form = document.getElementById('weather-form');
const cityInput = document.getElementById('name_of_city');

const weatherEmojis = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️'
};

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();
    if (!city) {
        return;
    }

    getWeather(city);
});

function getWeather(city) {
    const params = `q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?${params}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${params}`;

    Promise.all([
        fetch(currentUrl).then(parseResponse),
        fetch(forecastUrl).then(parseResponse)
    ])
        .then(function (results) {
            const current = results[0];
            const forecast = results[1];

            displayCurrentWeather(current);
            displayAirConditions(current, forecast.list[0]);
            displayTodayForecast(forecast.list);
            displaySevenDayForecast(forecast.list);
        })
        .catch(function (error) {
            alert(error.message);
        });
}

function parseResponse(response) {
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid API key (401). New OpenWeatherMap keys can take up to 2 hours to activate.');
        }
        if (response.status === 404) {
            throw new Error('City not found (404). Check the spelling and try again.');
        }
        throw new Error(`Request failed with status ${response.status}.`);
    }
    return response.json();
}

function displayCurrentWeather(data) {
    document.querySelector('#city-name span').textContent = `${data.name}, ${data.sys.country}`;
    document.querySelector('#temperature span').textContent = Math.round(data.main.temp);

    const condition = data.weather[0];
    const icon = document.querySelector('.weather-logo-now span');
    icon.textContent = weatherEmojis[condition.main] || '🌡️';
    icon.setAttribute('aria-label', condition.description);
}

function displayAirConditions(current, nextForecastSlot) {
    document.querySelector('#real-feel span').textContent = Math.round(current.main.feels_like);
    document.querySelector('#wind-speed span').textContent = Math.round(current.wind.speed * 3.6);
    document.querySelector('#pressure span').textContent = current.main.pressure;

    const chanceOfRain = Math.round((nextForecastSlot.pop || 0) * 100);
    document.querySelector('#chance-of-rain span').textContent = chanceOfRain;
    document.querySelector('#air-chance-of-rain span').textContent = chanceOfRain;
}

function displayTodayForecast(list) {
    const today = list[0].dt_txt.split(' ')[0];
    const todaySlots = list.filter(function (slot) {
        return slot.dt_txt.startsWith(today);
    });

    const headRow = document.querySelector('.today-forecast-time thead tr');
    const body = document.querySelector('.today-forecast-time tbody');
    headRow.innerHTML = '';
    body.innerHTML = '';

    const iconRow = document.createElement('tr');
    const tempRow = document.createElement('tr');

    todaySlots.forEach(function (slot) {
        const time = slot.dt_txt.split(' ')[1].slice(0, 5);

        const timeCell = document.createElement('th');
        timeCell.textContent = time;
        headRow.appendChild(timeCell);

        const iconCell = document.createElement('td');
        iconCell.textContent = weatherEmojis[slot.weather[0].main] || '🌡️';
        iconRow.appendChild(iconCell);

        const tempCell = document.createElement('td');
        tempCell.textContent = `${Math.round(slot.main.temp)}°`;
        tempRow.appendChild(tempCell);
    });

    body.appendChild(iconRow);
    body.appendChild(tempRow);
}

function displaySevenDayForecast(list) {
    const days = {};
    list.forEach(function (slot) {
        const date = slot.dt_txt.split(' ')[0];
        if (!days[date]) {
            days[date] = slot;
        }
    });

    const body = document.querySelector('.seven-day-forecast tbody');
    body.innerHTML = '';

    Object.keys(days).forEach(function (date) {
        const slot = days[date];
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

        const row = document.createElement('tr');

        const dayCell = document.createElement('td');
        dayCell.textContent = dayName;

        const weatherCell = document.createElement('td');
        weatherCell.textContent = weatherEmojis[slot.weather[0].main] || slot.weather[0].main;

        const tempCell = document.createElement('td');
        tempCell.textContent = `${Math.round(slot.main.temp)}°`;

        row.appendChild(dayCell);
        row.appendChild(weatherCell);
        row.appendChild(tempCell);
        body.appendChild(row);
    });
}
