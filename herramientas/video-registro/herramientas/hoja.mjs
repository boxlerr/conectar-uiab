// Hoja de contactos: junta cuadros en una grilla para revisarlos de un vistazo.
// Uso: node herramientas/hoja.mjs salida.png columnas img1 img2 ...
// Cada cuadro lleva su tiempo impreso (se rotula con Chromium: el ffmpeg de
// esta maquina no trae drawtext).

import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const [salida, columnas, ...imgs] = process.argv.slice(2)
const cols = Number(columnas)
const W = 640
const H = 360
const filas = Math.ceil(imgs.length / cols)
const celdas = await Promise.all(
  imgs.map(async (f) => ({
    src: `data:image/${f.endsWith('.png') ? 'png' : 'jpeg'};base64,${(await readFile(f)).toString('base64')}`,
    rotulo: path.basename(f).replace(/\.(png|jpg)$/, ''),
  })),
)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: cols * W, height: filas * H } })
await page.setContent(`<html><body style="margin:0;display:grid;grid-template-columns:repeat(${cols},${W}px);background:#222">
${celdas.map((c) => `<div style="position:relative;width:${W}px;height:${H}px;outline:1px solid #444"><img src="${c.src}" style="width:100%;height:100%;object-fit:contain;display:block"><span style="position:absolute;left:6px;top:6px;font:bold 15px monospace;color:#ff0;background:rgba(0,0,0,.7);padding:1px 5px">${c.rotulo}</span></div>`).join('')}
</body></html>`)
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())))
await page.screenshot({ path: salida })
await browser.close()
