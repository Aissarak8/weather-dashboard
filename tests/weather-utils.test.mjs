import assert from "node:assert/strict";
import test from "node:test";
import { formatLocalDate, roundTemperature } from "../weather-utils.js";

test("converts Celsius values for the selected display unit", () => {
  assert.equal(roundTemperature(20, "c"), 20);
  assert.equal(roundTemperature(20, "f"), 68);
});

test("formats observation time in the city's timezone", () => {
  const timestamp = Date.UTC(2026, 9, 29, 12) / 1000;
  assert.equal(
    formatLocalDate(timestamp, 3600, { hour: "numeric", hour12: false }),
    "13",
  );
});
