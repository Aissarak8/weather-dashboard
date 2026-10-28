import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

const apiBaseUrl = process.env.WEATHER_API_BASE_URL?.replace(/\/$/, "");
if (!apiBaseUrl || !apiBaseUrl.startsWith("https://")) {
  throw new Error(
    "WEATHER_API_BASE_URL must be set to the deployed HTTPS Worker URL.",
  );
}

await mkdir("dist", { recursive: true });
await Promise.all([
  cp("index.html", "dist/index.html"),
  cp("style.css", "dist/style.css"),
  cp("app.js", "dist/app.js"),
]);

const config = `window.WEATHER_CONFIG = ${JSON.stringify({ apiBaseUrl }, null, 2)};\n`;
await writeFile("dist/config.js", config, "utf8");

const html = await readFile("dist/index.html", "utf8");
if (!html.includes('<script src="config.js"></script>')) {
  throw new Error("index.html must load config.js before app.js.");
}

console.log(
  `Built static site in dist/ using proxy origin ${new URL(apiBaseUrl).origin}`,
);
