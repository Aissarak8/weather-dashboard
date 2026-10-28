export function convertTemperature(celsius, unit = "c") {
  if (!Number.isFinite(celsius)) return null;
  return unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
}

export function roundTemperature(celsius, unit = "c") {
  const converted = convertTemperature(celsius, unit);
  return converted === null ? null : Math.round(converted);
}

export function getLocalDate(dateTime, timezoneOffset = 0) {
  return new Date((dateTime + timezoneOffset) * 1000);
}

export function getDateKey(dateTime, timezoneOffset = 0) {
  return getLocalDate(dateTime, timezoneOffset).toISOString().slice(0, 10);
}

export function formatLocalDate(dateTime, timezoneOffset, options) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options,
  }).format(getLocalDate(dateTime, timezoneOffset));
}

export function groupForecastByDay(list, timezoneOffset = 0) {
  const groups = new Map();
  list.forEach((slot) => {
    const key = getDateKey(slot.dt, timezoneOffset);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(slot);
  });

  return [...groups.entries()].map(([key, slots]) => {
    const representative = slots.reduce((closest, slot) => {
      const hour = getLocalDate(slot.dt, timezoneOffset).getUTCHours();
      const closestHour = getLocalDate(
        closest.dt,
        timezoneOffset,
      ).getUTCHours();
      return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? slot : closest;
    }, slots[0]);

    return {
      key,
      slots,
      representative,
      min: Math.min(...slots.map((slot) => slot.main.temp_min)),
      max: Math.max(...slots.map((slot) => slot.main.temp_max)),
      precipitation: Math.max(...slots.map((slot) => slot.pop || 0)),
    };
  });
}
