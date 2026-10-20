/**
 * A code step: the forecast for a city on the day (or the coming weekend),
 * from Open-Meteo. No key needed. It runs before Taste and
 * adds a line to the profile, so the plan can say "bring a jacket" or move
 * the park to the morning, from a real forecast.
 *
 * Copy this file to write your own step: look something up in your CRM,
 * your booking system or any API, and hand the result to the run.
 */
import { CloudSunIcon } from "lucide-react";

import { defineStep } from "@core/catalogue/workflow";
import { f } from "@core/catalogue/fields";

type Place = { name: string; admin1?: string; country_code: string; latitude: number; longitude: number };
type Forecast = {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

// WMO weather codes, as words.
function sky(code: number) {
  if (code === 0) return "clear";
  if (code <= 2) return "mostly clear";
  if (code === 3) return "cloudy";
  if (code <= 48) return "foggy";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "showers";
  return "thunderstorms";
}

/** The date set, or the coming Saturday and Sunday. */
function daysWanted(date: string, today = new Date()) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return [date];
  const saturday = new Date(today);
  saturday.setUTCDate(today.getUTCDate() + ((6 - today.getUTCDay() + 7) % 7));
  const sunday = new Date(saturday);
  sunday.setUTCDate(saturday.getUTCDate() + 1);
  return [saturday, sunday].map((d) => d.toISOString().slice(0, 10));
}

export default defineStep({
  type: "weather",
  name: "Weather",
  description: "Adds the forecast for a city and date to the profile.",
  icon: CloudSunIcon,
  at: "before",
  fields: {
    location: f.text({ label: "City", placeholder: "Austin, TX", help: "Empty: the first lookup's city." }),
    date: f.text({ label: "Date", placeholder: "2026-11-14", help: "Empty: the coming weekend." }),
    units: f.segmented({
      label: "Units",
      options: [
        { value: "auto", label: "Local" },
        { value: "celsius", label: "°C" },
        { value: "fahrenheit", label: "°F" },
      ],
    }),
  },
  async run(props, ctx) {
    const location = props.location.trim() || ctx.location;
    if (!location) return { skipped: true, message: "No city set" };
    const [name, hint = ""] = location.split(",").map((part) => part.trim());
    await ctx.report(`Checking the forecast for ${location}`);

    const found = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`,
    ).then((r) => r.json<{ results?: Place[] }>());
    const places = found.results ?? [];
    const place =
      places.find(
        (p) => hint && [p.admin1, p.country_code].some((v) => v?.toLowerCase().startsWith(hint.toLowerCase())),
      ) ?? places[0];
    if (!place) return { skipped: true, message: `Couldn't find ${location}` };

    const unit = props.units === "auto" ? (place.country_code === "US" ? "fahrenheit" : "celsius") : props.units;
    const forecast = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto&forecast_days=16&temperature_unit=${unit}`,
    ).then((r) => r.json<Forecast>());

    const symbol = unit === "fahrenheit" ? "°F" : "°C";
    const days = daysWanted(props.date.trim()).flatMap((day) => {
      const i = forecast.daily.time.indexOf(day);
      if (i < 0) return [];
      const label = new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      const d = forecast.daily;
      return [
        {
          day,
          line: `${label}: ${sky(d.weather_code[i])}, ${Math.round(d.temperature_2m_max[i])}${symbol} high, ${Math.round(d.temperature_2m_min[i])}${symbol} low, ${d.precipitation_probability_max[i]}% chance of rain`,
        },
      ];
    });
    if (!days.length) return { skipped: true, message: "Too far ahead for a forecast" };

    return {
      output: { place: `${place.name}, ${place.admin1 ?? place.country_code}`, days },
      notes: [
        `Forecast for ${place.name}: ${days.map((d) => d.line).join("; ")}. Plan around it, but don't make it the headline.`,
      ],
      message: days.map((d) => d.line).join(" · "),
    };
  },
});
