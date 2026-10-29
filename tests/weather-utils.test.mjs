import assert from "node:assert/strict";
import test from "node:test";

import {
  getDateKey,
  groupForecastByDay,
  roundTemperature,
} from "../weather-utils.js";

test("converts Celsius display values without changing source data", () => {
  assert.equal(roundTemperature(20, "c"), 20);
  assert.equal(roundTemperature(20, "f"), 68);
  assert.equal(roundTemperature(-5.4, "f"), 22);
});

test("uses the city's timezone when grouping forecast slots", () => {
  const lateUtc = Date.UTC(2026, 9, 28, 23) / 1000;
  assert.equal(getDateKey(lateUtc, 2 * 60 * 60), "2026-10-29");
});

test("derives daily ranges from every real three-hour forecast slot", () => {
  const day = Date.UTC(2026, 9, 28, 0) / 1000;
  const slots = [
    {
      dt: day + 9 * 60 * 60,
      main: { temp_min: 12, temp_max: 15 },
      weather: [{ description: "cloudy" }],
      pop: 0.1,
    },
    {
      dt: day + 12 * 60 * 60,
      main: { temp_min: 14, temp_max: 21 },
      weather: [{ description: "clear" }],
      pop: 0.4,
    },
  ];
  const [forecastDay] = groupForecastByDay(slots, 0);

  assert.equal(forecastDay.min, 12);
  assert.equal(forecastDay.max, 21);
  assert.equal(forecastDay.precipitation, 0.4);
  assert.equal(forecastDay.representative.weather[0].description, "clear");
});
