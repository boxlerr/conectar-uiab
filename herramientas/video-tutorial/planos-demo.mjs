/**
 * Planos técnicos de demostración para la oportunidad que se filma.
 *
 * POR QUÉ SON DIBUJOS Y NO FOTOS
 *
 * El pedido del video necesitaba imágenes propias. Los dos generadores de
 * imágenes disponibles (Higgsfield y Gamma) están sin créditos, y Metalúrgica
 * Longchamps no tiene fotos cargadas en su catálogo, así que no había foto real
 * que usar. Inventar una foto de taller con un modelo tampoco era opción: el
 * criterio del proyecto es no mostrar material generado que se lea como real.
 *
 * Un plano acotado sí es lo que una metalúrgica adjunta de verdad a un pedido
 * de terminación superficial, se renderiza en vector —o sea que se ve nítido
 * con el zoom del montaje, a diferencia de una foto generada— y no finge ser
 * una fotografía de nada.
 *
 * Se dibujan con Chromium y se devuelven como PNG en memoria; demo-datos.mjs
 * los sube al bucket `oportunidades`.
 */
import { chromium } from "playwright";

const ANCHO = 1600;
const ALTO = 1000;

const BASE_CSS = `
  @page { margin: 0 }
  * { box-sizing: border-box; }
  body {
    margin: 0; width: ${ANCHO}px; height: ${ALTO}px; background: #fff;
    font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1a1a;
  }
  .hoja { position: absolute; inset: 26px; border: 2px solid #1a1a1a; }
  .hoja::after {
    content: ""; position: absolute; inset: 8px; border: 1px solid #1a1a1a;
  }
  .lienzo { position: absolute; inset: 20px; }
  .rotulo {
    position: absolute; right: 20px; bottom: 20px; width: 470px;
    border: 1.5px solid #1a1a1a; background: #fff; font-size: 13px;
  }
  .rotulo .fila { display: flex; border-bottom: 1px solid #1a1a1a; }
  .rotulo .fila:last-child { border-bottom: 0; }
  .rotulo .k {
    width: 132px; padding: 7px 10px; border-right: 1px solid #1a1a1a;
    text-transform: uppercase; letter-spacing: .09em; font-size: 10px;
    color: #555; align-self: stretch; display: flex; align-items: center;
  }
  .rotulo .v { padding: 7px 10px; font-weight: 600; }
  .rotulo .titulo {
    padding: 11px; font-weight: 800; font-size: 16px; letter-spacing: .02em;
    border-bottom: 1.5px solid #1a1a1a; text-transform: uppercase;
  }
  text { font-family: "Helvetica Neue", Arial, sans-serif; }
`;

/** Cota horizontal o vertical con flechas y valor. */
const cota = (x1, y1, x2, y2, texto, desplazar = 0) => {
  const horizontal = y1 === y2;
  const x = horizontal ? (x1 + x2) / 2 : x1 + desplazar;
  const y = horizontal ? y1 + desplazar : (y1 + y2) / 2;
  return `
    <line x1="${horizontal ? x1 : x1 + desplazar}" y1="${horizontal ? y1 + desplazar : y1}"
          x2="${horizontal ? x2 : x2 + desplazar}" y2="${horizontal ? y2 + desplazar : y2}"
          stroke="#1a1a1a" stroke-width="1" marker-start="url(#f)" marker-end="url(#f)"/>
    <rect x="${x - 34}" y="${y - 11}" width="68" height="22" fill="#fff"/>
    <text x="${x}" y="${y + 5}" font-size="15" text-anchor="middle" fill="#1a1a1a">${texto}</text>`;
};

function htmlBastidor() {
  return `<style>${BASE_CSS}</style>
  <div class="hoja"><div class="lienzo">
    <svg width="100%" height="100%" viewBox="0 0 1500 900">
      <defs>
        <marker id="f" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
          <path d="M0,4.5 L9,1.5 L9,7.5 z" fill="#1a1a1a"/>
        </marker>
      </defs>

      <!-- VISTA FRONTAL: bastidor rectangular con travesaños -->
      <g stroke="#1a1a1a" fill="none">
        <rect x="150" y="130" width="620" height="420" stroke-width="3"/>
        <rect x="182" y="162" width="556" height="356" stroke-width="1.6"/>
        <line x1="460" y1="162" x2="460" y2="518" stroke-width="2.4"/>
        <line x1="182" y1="340" x2="738" y2="340" stroke-width="2.4"/>
        <!-- cartelas de esquina -->
        <path d="M182,232 L252,162" stroke-width="1.6"/>
        <path d="M668,162 L738,232" stroke-width="1.6"/>
        <path d="M182,448 L252,518" stroke-width="1.6"/>
        <path d="M668,518 L738,448" stroke-width="1.6"/>
        <!-- agujeros de anclaje -->
        <circle cx="196" cy="176" r="9" stroke-width="1.6"/>
        <circle cx="724" cy="176" r="9" stroke-width="1.6"/>
        <circle cx="196" cy="504" r="9" stroke-width="1.6"/>
        <circle cx="724" cy="504" r="9" stroke-width="1.6"/>
      </g>
      <!-- ejes -->
      <g stroke="#1a1a1a" stroke-width="0.9" stroke-dasharray="16 5 3 5" opacity=".65">
        <line x1="110" y1="340" x2="810" y2="340"/>
        <line x1="460" y1="90" x2="460" y2="590"/>
      </g>
      ${cota(150, 610, 770, 610, "1240 mm")}
      ${cota(90, 130, 90, 550, "820 mm")}
      <text x="150" y="108" font-size="15" letter-spacing="1.6">VISTA FRONTAL — ESC. 1:10</text>

      <!-- VISTA LATERAL -->
      <g stroke="#1a1a1a" fill="none">
        <rect x="900" y="130" width="150" height="420" stroke-width="3"/>
        <line x1="932" y1="130" x2="932" y2="550" stroke-width="1.6"/>
        <line x1="1018" y1="130" x2="1018" y2="550" stroke-width="1.6"/>
      </g>
      ${cota(900, 610, 1050, 610, "300 mm")}
      <text x="900" y="108" font-size="15" letter-spacing="1.6">VISTA LATERAL</text>

      <!-- DETALLE DEL PERFIL -->
      <g stroke="#1a1a1a" fill="none">
        <rect x="1150" y="180" width="230" height="150" stroke-width="2.4"/>
        <rect x="1168" y="198" width="194" height="114" stroke-width="1.4"/>
      </g>
      <g fill="none" stroke="#1a1a1a" stroke-width="0.7" opacity=".5">
        ${Array.from({length: 16}, (_, i) =>
          `<line x1="${1150 + i*15}" y1="180" x2="${1150 + i*15 - 18}" y2="198"/>`).join("")}
      </g>
      <text x="1150" y="158" font-size="15" letter-spacing="1.6">DETALLE A — PERFIL</text>
      <text x="1150" y="370" font-size="15">Tubo estructural 100 × 60 × 3 mm</text>
      <text x="1150" y="396" font-size="15">Soldadura MIG continua, cordón 4 mm</text>
      <text x="1150" y="422" font-size="15">Aristas redondeadas R2 antes de pintar</text>
    </svg>
  </div>
  <div class="rotulo">
    <div class="titulo">Bastidor soporte · BS-800</div>
    <div class="fila"><div class="k">Solicita</div><div class="v">Metalúrgica Longchamps</div></div>
    <div class="fila"><div class="k">Material</div><div class="v">Acero SAE 1010 · e = 3 mm</div></div>
    <div class="fila"><div class="k">Cantidad</div><div class="v">800 unidades</div></div>
    <div class="fila"><div class="k">Tolerancia</div><div class="v">General ± 0,5 mm</div></div>
    <div class="fila"><div class="k">Plano</div><div class="v">01 de 02 · Rev. B</div></div>
  </div></div>`;
}

function htmlTerminacion() {
  const capas = [
    ["Acero base", "SAE 1010 · e = 3 mm", "#8a8a8a"],
    ["Desengrase y fosfatizado", "Fosfato de zinc", "#b9c6cf"],
    ["Imprimación epoxi", "20 – 30 µm", "#7f9bb5"],
    ["Poliéster en polvo", "60 – 80 µm · RAL 7016", "#4a5a68"],
  ];
  return `<style>${BASE_CSS}
    .tabla { position:absolute; left:0; top:470px; width:820px; border:1.5px solid #1a1a1a; font-size:14px; }
    .tabla .fila { display:flex; border-bottom:1px solid #1a1a1a; }
    .tabla .fila:last-child { border-bottom:0; }
    .tabla .fila.enc { background:#1a1a1a; color:#fff; font-size:10px;
      text-transform:uppercase; letter-spacing:.12em; }
    .tabla .c1 { width:300px; padding:9px 12px; border-right:1px solid #1a1a1a; }
    .tabla .c2 { width:250px; padding:9px 12px; border-right:1px solid #1a1a1a; }
    .tabla .c3 { flex:1; padding:9px 12px; }
    .tabla .enc .c1, .tabla .enc .c2 { border-right-color:#fff; }
  </style>
  <div class="hoja"><div class="lienzo">
    <svg width="820" height="430" viewBox="0 0 820 430">
      <text x="0" y="22" font-size="15" letter-spacing="1.6">CORTE B-B — ESQUEMA DE CAPAS (no a escala)</text>
      ${capas.map(([n, d, color], i) => {
        const y = 330 - i * 66;
        const alto = i === 0 ? 54 : 40;
        return `
          <rect x="0" y="${y}" width="430" height="${alto}" fill="${color}" stroke="#1a1a1a" stroke-width="1.6"/>
          <line x1="430" y1="${y + alto / 2}" x2="486" y2="${y + alto / 2}" stroke="#1a1a1a" stroke-width="1"/>
          <circle cx="430" cy="${y + alto / 2}" r="3.5" fill="#1a1a1a"/>
          <text x="496" y="${y + alto / 2 - 3}" font-size="15" font-weight="600">${n}</text>
          <text x="496" y="${y + alto / 2 + 16}" font-size="13" fill="#555">${d}</text>`;
      }).join("")}
    </svg>
    <div class="tabla">
      <div class="fila enc"><div class="c1">Requisito</div><div class="c2">Especificación</div><div class="c3">Norma / ensayo</div></div>
      <div class="fila"><div class="c1">Espesor de película seca</div><div class="c2">80 – 110 µm</div><div class="c3">ISO 2808</div></div>
      <div class="fila"><div class="c1">Adherencia</div><div class="c2">Grado 0 – 1</div><div class="c3">ISO 2409 (corte enrejado)</div></div>
      <div class="fila"><div class="c1">Niebla salina</div><div class="c2">≥ 480 h sin ampollado</div><div class="c3">ASTM B117</div></div>
      <div class="fila"><div class="c1">Brillo</div><div class="c2">30 ± 5 GU a 60°</div><div class="c3">ISO 2813</div></div>
      <div class="fila"><div class="c1">Color</div><div class="c2">RAL 7016 · semimate</div><div class="c3">Muestra aprobada por el solicitante</div></div>
    </div>
  </div>
  <div class="rotulo">
    <div class="titulo">Especificación de terminación</div>
    <div class="fila"><div class="k">Solicita</div><div class="v">Metalúrgica Longchamps</div></div>
    <div class="fila"><div class="k">Proceso</div><div class="v">Pintura en polvo termoconvertible</div></div>
    <div class="fila"><div class="k">Lote</div><div class="v">800 u. · 4 entregas parciales</div></div>
    <div class="fila"><div class="k">Ensayos</div><div class="v">Por lote, con protocolo escrito</div></div>
    <div class="fila"><div class="k">Plano</div><div class="v">02 de 02 · Rev. B</div></div>
  </div></div>`;
}

export async function dibujarPlanos() {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({
    viewport: { width: ANCHO, height: ALTO },
    deviceScaleFactor: 2, // 3200×2000: aguanta el acercamiento del montaje
  });
  const page = await ctx.newPage();
  const salida = [];
  for (const [nombre, html] of [
    ["plano-bastidor-BS-800.png", htmlBastidor()],
    ["especificacion-terminacion.png", htmlTerminacion()],
  ]) {
    await page.setContent(html, { waitUntil: "load" });
    salida.push({ nombre, buffer: await page.screenshot({ type: "png" }) });
  }
  await navegador.close();
  return salida;
}

// `node planos-demo.mjs` los deja en disco para poder mirarlos.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFileSync } = await import("node:fs");
  for (const { nombre, buffer } of await dibujarPlanos()) {
    writeFileSync(nombre, buffer);
    console.log(`✓ ${nombre} — ${(buffer.length / 1024).toFixed(0)} kB`);
  }
}
