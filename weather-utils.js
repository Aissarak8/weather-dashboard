export function convertTemperature(celsius, unit = "c") {
  if (!Number.isFinite(celsius)) return null;
  return unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
}

export function roundTemperature(celsius, unit = "c") {
  const converted = convertTemperature(celsius, unit);
  return converted === null ? null : Math.round(converted);
}

export function formatLocalDate(dateTime, timezoneOffset, options) {
  const localDate = new Date((dateTime + timezoneOffset) * 1000);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options,
  }).format(localDate);
}
