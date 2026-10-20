// Saca de la traza de Lighthouse los eventos LayoutShift con tiempos y rects.
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import path from "node:path";
const CHROME = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
const url = (process.env.BASE || "http://localhost:3100") + (process.argv[2] || "/empresas");
const chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ["--headless=new"] });
const r = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance"] });
const ev = r.artifacts.Trace.traceEvents;
const nav = ev.find((e) => e.name === "navigationStart" && e.args?.data?.isLoadingMainFrame) || ev.find((e) => e.name === "navigationStart");
const t0 = nav.ts;
const marcas = ev.filter((e) => ["firstContentfulPaint", "largestContentfulPaint::Candidate", "domContentLoadedEventEnd", "loadEventEnd"].includes(e.name));
for (const m of marcas) console.log(((m.ts - t0) / 1000).toFixed(0).padStart(6) + "ms", m.name);
for (const e of ev.filter((e) => e.name === "LayoutShift")) {
  const d = e.args.data;
  console.log(((e.ts - t0) / 1000).toFixed(0).padStart(6) + "ms LayoutShift score=" + d.score.toFixed(3), "recentInput=" + d.had_recent_input);
  for (const n of d.impacted_nodes || []) console.log("        nodo", n.node_id, "antes", JSON.stringify(n.old_rect), "después", JSON.stringify(n.new_rect));
}
const vp = ev.find((e) => e.name === "LayoutShift")?.args?.frame;
console.log("viewport LH:", JSON.stringify(r.lhr.configSettings.screenEmulation), "UA:", r.lhr.environment.networkUserAgent);
await chrome.kill();
