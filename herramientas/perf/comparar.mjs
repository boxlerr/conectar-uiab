// Compara dos mediciones de medir.mjs (antes vs después), o imprime una sola.
// Uso: node comparar.mjs antes.json [despues.json]
import fs from "node:fs";
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
const cols = [
  ["ttfb", "TTFB", 0], ["lcp", "LCP", 0], ["jsKB", "JS KB", 0], ["imgKB", "Img KB", 0],
  ["totalKB", "Total KB", 0], ["requests", "Req", 0], ["rscReqs", "RSC", 0],
  ["preloadsImagen", "PreImg", 0], ["supaServidor", "Q.srv", 0], ["supaBrowser", "Q.brw", 0], ["htmlKB", "HTML KB", 0],
];
const fmt = (v) => (v == null ? "-" : Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(1));
for (const modo of ["anon", "logueado"]) {
  const rutas = Object.keys(a[modo] || {});
  if (!rutas.length) continue;
  console.log(`\n## ${modo}`);
  console.log(["ruta".padEnd(26), ...cols.map(([, t]) => t.padStart(b ? 15 : 8))].join(" "));
  for (const r of rutas) {
    const fa = a[modo][r], fb = b?.[modo]?.[r];
    const celdas = cols.map(([k]) => {
      if (!b) return String(fmt(fa[k])).padStart(8);
      if (!fb) return `${fmt(fa[k])}→?`.padStart(15);
      const d = fa[k] ? Math.round(((fb[k] - fa[k]) / fa[k]) * 100) : 0;
      return `${fmt(fa[k])}→${fmt(fb[k])}${d ? ` (${d > 0 ? "+" : ""}${d}%)` : ""}`.padStart(15);
    });
    console.log([r.slice(0, 26).padEnd(26), ...celdas].join(" "));
  }
}
