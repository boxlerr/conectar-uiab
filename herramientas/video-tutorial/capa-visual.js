/**
 * Capa visual del screencast de UIAB Conecta.
 *
 * Se inyecta con addInitScript, así que corre en CADA documento (incluidas las
 * navegaciones duras). Todo vive en #uiab-cast, colgado de documentElement y
 * con pointer-events:none, para no interferir con los clicks que dispara
 * Playwright ni con el layout de la app.
 *
 * Expone window.__cast — el guion (guion.mjs) lo maneja vía page.evaluate.
 */
(() => {
  if (window.__cast) return;

  const MARCA = {
    navy: "#0c3c60",
    navyOscuro: "#072a44",
    azul: "#0382bf",
    azulClaro: "#5fb9e8",
    naranja: "#f97316",
    blanco: "#ffffff",
  };

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  // Las variables de fuente (--font-poppins, --font-open-sans) las define
  // next/font sobre <body>. La capa cuelga de <html>, que es el PADRE de body,
  // así que no las hereda: hay que copiarlas a mano.
  function heredarFuentes(nodo) {
    const cs = getComputedStyle(document.body);
    for (const v of ["--font-poppins", "--font-open-sans", "--font-manrope"]) {
      const valor = cs.getPropertyValue(v);
      if (valor) nodo.style.setProperty(v, valor);
    }
  }

  const CSS = `
  /* El indicador de dev de Next (la "N" con el contador de issues) aparece
     abajo a la izquierda y delata que es un build de desarrollo. Fuera. */
  nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-tools-button],
  #__next-build-watcher { display: none !important; }

  #uiab-cast, #uiab-cast * { box-sizing: border-box; margin: 0; padding: 0; }
  #uiab-cast {
    position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
    font-family: var(--font-open-sans), "Open Sans", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Cursor ─────────────────────────────────────────────────────── */
  #uiab-cursor {
    position: absolute; top: 0; left: 0; width: 30px; height: 30px;
    will-change: transform; transform: translate3d(-100px,-100px,0);
    filter: drop-shadow(0 3px 7px rgba(2,20,40,.45));
    transition: scale .12s ease;
  }
  #uiab-cursor.presionado { scale: .82; }
  /* Sobre una placa a pantalla completa no hay nada que señalar: el puntero
     flotando ahí sólo delata que es una grabación automatizada. */
  #uiab-placa.visible ~ #uiab-cursor,
  #uiab-placa.visible ~ #uiab-onda { opacity: 0; transition: opacity .3s ease; }
  #uiab-onda {
    position: absolute; top: 0; left: 0; width: 22px; height: 22px;
    margin: -11px 0 0 -11px; border-radius: 50%;
    border: 2.5px solid ${MARCA.naranja}; opacity: 0;
    will-change: transform, opacity;
  }
  @keyframes uiab-onda-anim {
    0%   { transform: scale(.35); opacity: .95; }
    100% { transform: scale(3.6);  opacity: 0; }
  }

  /* ── Foco sobre un elemento ─────────────────────────────────────── */
  #uiab-foco {
    position: absolute; border-radius: 14px; opacity: 0;
    border: 2.5px solid ${MARCA.naranja};
    box-shadow: 0 0 0 4px rgba(249,115,22,.16),
                0 0 26px 6px rgba(249,115,22,.28),
                0 0 0 9999px rgba(7,42,68,0);
    transition: opacity .32s ease, top .5s cubic-bezier(.22,1,.36,1),
                left .5s cubic-bezier(.22,1,.36,1),
                width .5s cubic-bezier(.22,1,.36,1),
                height .5s cubic-bezier(.22,1,.36,1),
                box-shadow .45s ease;
  }
  #uiab-foco.visible { opacity: 1; }
  #uiab-foco.atenuando { box-shadow: 0 0 0 4px rgba(249,115,22,.16),
                0 0 26px 6px rgba(249,115,22,.28),
                0 0 0 9999px rgba(7,42,68,.42); }

  /* ── Zona inferior: chip de capítulo + subtítulo, alineados ─────── */
  #uiab-inferior {
    position: absolute; left: 50%; bottom: 54px; width: min(940px, 78vw);
    transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
  }

  /* ── Subtítulo (lower third) ────────────────────────────────────── */
  #uiab-sub {
    position: relative; width: 100%;
    transform: translateY(26px); opacity: 0;
    background: rgba(12,60,96,.95);
    -webkit-backdrop-filter: blur(16px) saturate(1.3);
    backdrop-filter: blur(16px) saturate(1.3);
    border-radius: 18px; border: 1px solid rgba(255,255,255,.1);
    border-left: 5px solid ${MARCA.naranja};
    padding: 20px 30px 22px;
    box-shadow: 0 22px 55px rgba(2,20,40,.5);
    transition: opacity .42s ease, transform .52s cubic-bezier(.22,1,.36,1);
  }
  #uiab-sub.visible { opacity: 1; transform: translateY(0); }
  #uiab-sub .rotulo {
    font-family: var(--font-poppins), Poppins, system-ui, sans-serif;
    font-weight: 700; font-size: 13px; letter-spacing: .13em;
    text-transform: uppercase; color: ${MARCA.azulClaro}; margin-bottom: 7px;
  }
  #uiab-sub .cuerpo {
    font-size: 25px; line-height: 1.36; color: #fff; font-weight: 400;
  }
  #uiab-sub .cuerpo b { font-weight: 700; color: #ffd9b8; }

  /* ── Chip de capítulo (arriba del subtítulo, no sobre el logo) ──── */
  #uiab-chip {
    display: flex; align-items: center; gap: 10px;
    background: rgba(12,60,96,.94);
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 999px; padding: 9px 18px 9px 14px;
    box-shadow: 0 10px 30px rgba(2,20,40,.35);
    opacity: 0; transform: translateY(-14px);
    transition: opacity .38s ease, transform .45s cubic-bezier(.22,1,.36,1);
  }
  #uiab-chip.visible { opacity: 1; transform: translateY(0); }
  #uiab-chip .punto {
    width: 9px; height: 9px; border-radius: 50%; background: ${MARCA.naranja};
    box-shadow: 0 0 0 4px rgba(249,115,22,.22);
  }
  #uiab-chip .texto {
    font-family: var(--font-poppins), Poppins, system-ui, sans-serif;
    font-weight: 600; font-size: 13.5px; letter-spacing: .1em;
    text-transform: uppercase; color: #fff;
  }

  /* ── Barra de progreso ──────────────────────────────────────────── */
  #uiab-barra {
    position: absolute; top: 0; left: 0; height: 4px; width: 0%;
    background: linear-gradient(90deg, ${MARCA.azul}, ${MARCA.naranja});
    box-shadow: 0 0 12px rgba(249,115,22,.5);
    transition: width .85s cubic-bezier(.4,0,.2,1);
  }

  /* ── Placa a pantalla completa ──────────────────────────────────── */
  #uiab-placa {
    position: absolute; inset: 0; opacity: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 0;
    background:
      radial-gradient(1100px 620px at 50% 34%, #14507f 0%, ${MARCA.navy} 46%, ${MARCA.navyOscuro} 100%);
    transition: opacity .62s ease;
  }
  #uiab-placa.visible { opacity: 1; }
  #uiab-placa .trama {
    position: absolute; inset: -40%;
    background-image: repeating-linear-gradient(
      118deg, rgba(255,255,255,.045) 0 2px, transparent 2px 90px);
    opacity: .85;
  }
  #uiab-placa .brillo {
    position: absolute; width: 780px; height: 780px; border-radius: 50%;
    background: radial-gradient(circle, rgba(3,130,191,.34) 0%, transparent 66%);
    filter: blur(46px);
  }
  #uiab-placa .contenido {
    position: relative; display: flex; flex-direction: column;
    align-items: center; text-align: center; padding: 0 60px;
  }
  #uiab-placa .logo {
    height: 62px; margin-bottom: 40px;
    filter: brightness(0) invert(1);
    opacity: 0; transform: translateY(16px);
    transition: opacity .7s ease .1s, transform .8s cubic-bezier(.22,1,.36,1) .1s;
  }
  #uiab-placa .rotulo {
    font-family: var(--font-poppins), Poppins, system-ui, sans-serif;
    font-weight: 700; font-size: 15px; letter-spacing: .3em;
    text-transform: uppercase; color: ${MARCA.naranja}; margin-bottom: 18px;
    opacity: 0; transform: translateY(16px);
    transition: opacity .7s ease .22s, transform .8s cubic-bezier(.22,1,.36,1) .22s;
  }
  #uiab-placa h1 {
    font-family: var(--font-poppins), Poppins, system-ui, sans-serif;
    font-weight: 800; font-size: 66px; line-height: 1.08; color: #fff;
    letter-spacing: -.02em; max-width: 17ch;
    opacity: 0; transform: translateY(20px);
    transition: opacity .75s ease .32s, transform .85s cubic-bezier(.22,1,.36,1) .32s;
  }
  #uiab-placa .regla {
    width: 0; height: 4px; border-radius: 2px; margin: 30px 0 26px;
    background: linear-gradient(90deg, ${MARCA.naranja}, ${MARCA.azul});
    transition: width .9s cubic-bezier(.22,1,.36,1) .5s;
  }
  #uiab-placa p {
    font-size: 25px; line-height: 1.5; color: rgba(233,244,252,.86);
    max-width: 30ch; font-weight: 300;
    opacity: 0; transform: translateY(16px);
    transition: opacity .75s ease .6s, transform .85s cubic-bezier(.22,1,.36,1) .6s;
  }
  #uiab-placa.entrar .logo,
  #uiab-placa.entrar .rotulo,
  #uiab-placa.entrar h1,
  #uiab-placa.entrar p { opacity: 1; transform: translateY(0); }
  #uiab-placa.entrar .regla { width: 128px; }
  `;

  const raiz = document.createElement("div");
  raiz.id = "uiab-cast";
  raiz.innerHTML = `
    <style>${CSS}</style>
    <div id="uiab-barra"></div>
    <div id="uiab-foco"></div>
    <div id="uiab-inferior">
      <div id="uiab-chip"><span class="punto"></span><span class="texto"></span></div>
      <div id="uiab-sub"><div class="rotulo"></div><div class="cuerpo"></div></div>
    </div>
    <div id="uiab-placa">
      <div class="trama"></div><div class="brillo"></div>
      <div class="contenido">
        <img class="logo" src="/logo-uiab-conecta.svg" alt="">
        <div class="rotulo"></div>
        <h1></h1>
        <div class="regla"></div>
        <p></p>
      </div>
    </div>
    <div id="uiab-onda"></div>
    <svg id="uiab-cursor" viewBox="0 0 24 24" fill="none">
      <path d="M5.5 2.8 19.6 12.1c.85.56.5 1.88-.52 1.94l-6.03.36-3.1 5.36c-.52.9-1.88.6-1.98-.44L5.5 2.8Z"
            fill="#fff" stroke="${MARCA.navy}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>
  `;

  // addInitScript corre antes de que exista <html>: sin esta guarda tira
  // "Cannot read properties of null" en cada documento.
  function montar() {
    const raizDoc = document.documentElement;
    if (!raizDoc) return false;
    if (!raizDoc.contains(raiz)) {
      raizDoc.appendChild(raiz);
      if (document.body) heredarFuentes(raiz);
    }
    return true;
  }

  const $ = (sel) => raiz.querySelector(sel);
  const cursor = () => $("#uiab-cursor");
  const onda = () => $("#uiab-onda");

  // ── El cursor espeja los eventos reales que dispara Playwright ────
  let ultX = -100, ultY = -100;
  const mover = (x, y) => {
    ultX = x; ultY = y;
    const c = cursor();
    if (c) c.style.transform = `translate3d(${x - 3}px, ${y - 2}px, 0)`;
  };
  document.addEventListener("mousemove", (e) => mover(e.clientX, e.clientY), true);
  document.addEventListener("mousedown", () => {
    cursor()?.classList.add("presionado");
    const o = onda();
    if (!o) return;
    o.style.left = `${ultX}px`;
    o.style.top = `${ultY}px`;
    o.style.animation = "none";
    void o.offsetWidth;
    o.style.animation = "uiab-onda-anim .62s cubic-bezier(.2,.7,.3,1)";
  }, true);
  document.addEventListener("mouseup", () => cursor()?.classList.remove("presionado"), true);

  window.__cast = {
    montar,
    /** El video arranca recién cuando las fuentes están listas. */
    async listo() {
      montar();
      try { await document.fonts.ready; } catch {}
      if (document.body) heredarFuentes(raiz);
    },
    posicionarCursor(x, y) { montar(); mover(x, y); },

    async sub(rotulo, cuerpo) {
      montar();
      const el = $("#uiab-sub");
      const yaVisible = el.classList.contains("visible");
      if (yaVisible) { el.classList.remove("visible"); await espera(300); }
      el.querySelector(".rotulo").textContent = rotulo;
      el.querySelector(".cuerpo").innerHTML = cuerpo;
      void el.offsetWidth;
      el.classList.add("visible");
      await espera(520);
    },
    async subOff() {
      const el = $("#uiab-sub");
      if (!el?.classList.contains("visible")) return;
      el.classList.remove("visible");
      await espera(420);
    },

    async chip(texto) {
      montar();
      const el = $("#uiab-chip");
      if (texto === null) { el.classList.remove("visible"); await espera(380); return; }
      el.querySelector(".texto").textContent = texto;
      el.classList.add("visible");
      await espera(420);
    },

    progreso(pct) { montar(); $("#uiab-barra").style.width = `${pct}%`; },

    async foco(selector, { atenuar = false, radio = 14, idx = 0 } = {}) {
      montar();
      const objetivo = document.querySelectorAll(selector)[idx];
      const el = $("#uiab-foco");
      if (!objetivo) { el.classList.remove("visible"); return false; }
      const r = objetivo.getBoundingClientRect();
      const m = 10;
      el.style.borderRadius = `${radio}px`;
      el.style.top = `${r.top - m}px`;
      el.style.left = `${r.left - m}px`;
      el.style.width = `${r.width + m * 2}px`;
      el.style.height = `${r.height + m * 2}px`;
      el.classList.toggle("atenuando", atenuar);
      el.classList.add("visible");
      await espera(520);
      return true;
    },
    async focoOff() {
      const el = $("#uiab-foco");
      el.classList.remove("visible", "atenuando");
      await espera(340);
    },

    async placa({ rotulo = "", titulo = "", texto = "", ms = 2600 }) {
      montar();
      const el = $("#uiab-placa");
      el.querySelector(".rotulo").textContent = rotulo;
      el.querySelector("h1").textContent = titulo;
      el.querySelector("p").textContent = texto;
      el.classList.remove("entrar");
      void el.offsetWidth;
      el.classList.add("visible");
      await espera(120);
      el.classList.add("entrar");
      await espera(ms);
    },
    async placaOff() {
      const el = $("#uiab-placa");
      el.classList.remove("visible");
      await espera(660);
      el.classList.remove("entrar");
    },

    /** Scroll con easing propio: window.scrollTo({behavior:"smooth"}) va
     *  demasiado rápido y entrecortado para filmar. */
    async scrollSuave(y, ms = 1100) {
      montar();
      const desde = window.scrollY;
      const delta = y - desde;
      if (Math.abs(delta) < 2) return;
      const t0 = performance.now();
      await new Promise((resolve) => {
        const paso = (t) => {
          const p = Math.min(1, (t - t0) / ms);
          // easeInOutCubic
          const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          window.scrollTo(0, desde + delta * e);
          p < 1 ? requestAnimationFrame(paso) : resolve();
        };
        requestAnimationFrame(paso);
      });
    },

    async scrollAlSelector(selector, { offset = 150, ms = 1100, idx = 0 } = {}) {
      const el = document.querySelectorAll(selector)[idx];
      if (!el) return false;
      const y = window.scrollY + el.getBoundingClientRect().top - offset;
      await this.scrollSuave(Math.max(0, y), ms);
      return true;
    },

    /** Caja del elemento en coordenadas de viewport, para mover el mouse. */
    caja(selector, idx = 0) {
      const el = document.querySelectorAll(selector)[idx];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    },
  };

  // Next hace navegación de cliente; si algún re-render se lleva puesta la
  // capa, la volvemos a colgar.
  const vigilar = () => {
    if (!montar()) { requestAnimationFrame(vigilar); return; }
    new MutationObserver(montar).observe(document.documentElement, { childList: true });
  };
  vigilar();
  document.addEventListener("DOMContentLoaded", montar);
})();
