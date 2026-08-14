/**
 * Capa visual del screencast de UIAB Conecta — versión "material crudo".
 *
 * Antes esta capa dibujaba TODA la dirección adentro de la página: subtítulos,
 * chips, recuadro de foco naranja, placas, barra de progreso, sellos. Eso es lo
 * que hacía que la pieza se viera como un screencast con globitos pegados
 * encima. Ahora la dirección vive en el montaje (ver montar.mjs) y acá queda
 * sólo lo que NO se puede agregar después:
 *
 *   · el cursor  — Playwright mueve un mouse invisible; sin esto no se ve
 *                  qué se está apretando.
 *   · la onda del click — feedback del apretón, medio segundo.
 *   · la claqueta — un destello verde al arrancar, para que el montaje sepa
 *                  en qué fotograma del .webm cae el reloj del guion.
 *
 * Se inyecta con addInitScript, así que corre en CADA documento (incluidas las
 * navegaciones duras). Todo vive en #uiab-cast, colgado de documentElement y
 * con pointer-events:none, para no interferir con los clicks que dispara
 * Playwright ni con el layout de la app.
 *
 * Expone window.__cast — el piloto (piloto.mjs) lo maneja vía page.evaluate.
 */
(() => {
  if (window.__cast) return;

  const MARCA = { navy: "#0c3c60", naranja: "#f97316" };

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  const CSS = `
  /* El indicador de dev de Next (la "N" con el contador de issues) aparece
     abajo a la izquierda y delata que es un build de desarrollo. Fuera. */
  nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-tools-button],
  #__next-build-watcher { display: none !important; }

  #uiab-cast, #uiab-cast * { box-sizing: border-box; margin: 0; padding: 0; }
  #uiab-cast {
    position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
  }

  #uiab-cursor {
    position: absolute; top: 0; left: 0; width: 30px; height: 30px;
    will-change: transform; transform: translate3d(-100px,-100px,0);
    filter: drop-shadow(0 3px 7px rgba(2,20,40,.45));
    transition: scale .12s ease;
  }
  #uiab-cursor.presionado { scale: .82; }

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

  /* Claqueta: verde puro a pantalla completa. No se ve en la pieza final
     porque el montaje corta justo después. */
  #uiab-claqueta {
    position: fixed; inset: 0; background: #00ff00; display: none;
    z-index: 2147483647;
  }
  #uiab-claqueta.visible { display: block; }
  `;

  const raiz = document.createElement("div");
  raiz.id = "uiab-cast";
  raiz.innerHTML = `
    <style>${CSS}</style>
    <div id="uiab-onda"></div>
    <svg id="uiab-cursor" viewBox="0 0 24 24" fill="none">
      <path d="M5.5 2.8 19.6 12.1c.85.56.5 1.88-.52 1.94l-6.03.36-3.1 5.36c-.52.9-1.88.6-1.98-.44L5.5 2.8Z"
            fill="#fff" stroke="${MARCA.navy}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>
    <div id="uiab-claqueta"></div>
  `;

  // addInitScript corre antes de que exista <html>: sin esta guarda tira
  // "Cannot read properties of null" en cada documento.
  function montar() {
    const raizDoc = document.documentElement;
    if (!raizDoc) return false;
    if (!raizDoc.contains(raiz)) raizDoc.appendChild(raiz);
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

  /** Espera a que el navegador haya PINTADO lo último que se le pidió. */
  const pintado = () => new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)));

  // ── Quién mueve la página ─────────────────────────────────────────
  // La app scrollea sola en varios lados (el directorio, apenas escribís la
  // primera letra, hace scrollIntoView hasta los resultados). Está muy bien
  // como producto, pero durante un plano significa que el contenido se va de
  // cuadro y NINGÚN encuadre fijo lo puede seguir.
  //
  // Con el scroll congelado, sólo mueve la página el guion. Se guardan las
  // funciones originales para que nuestro propio scroll siga andando.
  const scrollToOriginal = window.scrollTo.bind(window);
  const verOriginal = Element.prototype.scrollIntoView;
  let congelado = false;
  window.scrollTo = (...a) => { if (congelado) return; return scrollToOriginal(...a); };
  Element.prototype.scrollIntoView = function (...a) {
    if (congelado) return;
    return verOriginal.apply(this, a);
  };

  window.__cast = {
    montar,
    /** El video arranca recién cuando las fuentes están listas. */
    async listo() {
      montar();
      try { await document.fonts.ready; } catch {}
    },
    posicionarCursor(x, y) { montar(); mover(x, y); },

    /** Durante un plano, la página la mueve el guion y nadie más. */
    congelarScroll(v) { congelado = !!v; },

    /**
     * Congela las animaciones DECORATIVAS del sitio mientras dura un plano.
     *
     * El directorio tiene una franja de logos de socias que se desplaza sola,
     * en loop. Encuadrada debajo del cartel, esa cinta moviéndose se lee como
     * si el video estuviera roto. Quieta se ve perfecto y se sigue entendiendo
     * qué es. No toca las transiciones de la UI, que son cortas y responden a
     * lo que hace el guion: sólo lo que se mueve solo, para siempre.
     */
    congelarAnimaciones(v) {
      const id = "uiab-sin-animaciones";
      const previo = document.getElementById(id);
      if (!v) { previo?.remove(); return; }
      if (previo) return;
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `*,*::before,*::after{
        animation-play-state:paused !important;
        animation-iteration-count:1 !important;
      }`;
      (document.head || document.documentElement).appendChild(s);
    },

    /**
     * Claqueta de sincronía. Devuelve el reloj de pared del momento en que el
     * verde YA está pintado; el montaje busca el primer fotograma verde del
     * .webm y con esos dos datos ata el guion al video.
     *
     * Hace falta porque Playwright empieza a grabar cuando se crea la página,
     * y entre ese instante y el primer fotograma real hay una demora que
     * cambia en cada corrida.
     */
    async claqueta(ms = 300) {
      montar();
      const el = $("#uiab-claqueta");
      el.classList.add("visible");
      await pintado();
      const t = Date.now();
      await espera(ms);
      el.classList.remove("visible");
      await pintado();
      return t;
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
          scrollToOriginal(0, desde + delta * e);
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

    /** Caja del elemento en coordenadas de viewport, para mover el mouse y
     *  —ahora— para que el montaje sepa dónde encuadrar. */
    caja(selector, idx = 0) {
      const el = document.querySelectorAll(selector)[idx];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    },

    /** Caja que abarca VARIOS selectores: para encuadrar "la tarjeta y su
     *  título" sin inventar un contenedor en la app. */
    cajaDe(selectores) {
      const cajas = selectores
        .map((s) => this.caja(typeof s === "string" ? s : s.sel, s.idx ?? 0))
        .filter(Boolean);
      if (!cajas.length) return null;
      const x = Math.min(...cajas.map((c) => c.x));
      const y = Math.min(...cajas.map((c) => c.y));
      const x2 = Math.max(...cajas.map((c) => c.x + c.w));
      const y2 = Math.max(...cajas.map((c) => c.y + c.h));
      return { x, y, w: x2 - x, h: y2 - y };
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
