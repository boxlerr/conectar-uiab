/**
 * Gráficos del panel de control: SVG a mano, sin librería.
 *
 * Son dos formas simples sobre una serie de 30 números. Meter Recharts (~90 KB
 * de JS) para esto obligaría además a que la tarjeta sea un Client Component,
 * cuando así se renderiza entera en el servidor y llega como HTML.
 *
 * NO HAY DATOS DE RELLENO. Los dos componentes reciben la serie real de
 * `visitas_perfil` y, si viene en cero, el que decide qué mostrar es el
 * llamador. Ninguno inventa una curva para "que se vea lindo".
 */
import type { PuntoSerie } from "@/modulos/visitas/estadisticas";
import { etiquetaDia } from "@/modulos/visitas/estadisticas";

/**
 * Interpolación cúbica monótona (Fritsch–Carlson).
 *
 * Una spline común le pone panza a la curva y con conteos diarios eso dibuja
 * visitas negativas entre dos ceros: literalmente muestra algo que no pasó. La
 * monótona no se pasa nunca de los puntos que une, así que suaviza sin mentir.
 */
function rutaMonotona(puntos: { x: number; y: number }[]): string {
  const n = puntos.length;
  if (n === 0) return "";
  if (n === 1) return `M ${puntos[0].x} ${puntos[0].y}`;

  // Pendiente de cada tramo.
  const dx: number[] = [];
  const dy: number[] = [];
  const pendiente: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(puntos[i + 1].x - puntos[i].x);
    dy.push(puntos[i + 1].y - puntos[i].y);
    pendiente.push(dy[i] / dx[i]);
  }

  // Tangente en cada punto, recortada para que no haya sobrepaso.
  const m: number[] = new Array(n);
  m[0] = pendiente[0];
  m[n - 1] = pendiente[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (pendiente[i - 1] * pendiente[i] <= 0) {
      m[i] = 0; // cambio de dirección: acá la curva tiene que apoyar plano
    } else {
      m[i] = (pendiente[i - 1] + pendiente[i]) / 2;
      const limite = 3 * Math.min(Math.abs(pendiente[i - 1]), Math.abs(pendiente[i]));
      if (Math.abs(m[i]) > limite) m[i] = Math.sign(m[i]) * limite;
    }
  }

  let d = `M ${puntos[0].x} ${puntos[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = puntos[i].x + dx[i] / 3;
    const c1y = puntos[i].y + (m[i] * dx[i]) / 3;
    const c2x = puntos[i + 1].x - dx[i] / 3;
    const c2y = puntos[i + 1].y - (m[i + 1] * dx[i]) / 3;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${puntos[i + 1].x} ${puntos[i + 1].y}`;
  }
  return d;
}

function coordenadas(serie: PuntoSerie[], ancho: number, alto: number, techo: number) {
  const paso = serie.length > 1 ? ancho / (serie.length - 1) : 0;
  return serie.map((punto, i) => ({
    x: Number((i * paso).toFixed(2)),
    y: Number((alto - (punto.visitas / techo) * alto).toFixed(2)),
  }));
}

/**
 * El techo del eje Y.
 *
 * Se redondea hacia arriba para que la curva no toque el borde de la caja y
 * para que la referencia de arriba sea un número redondo. Mínimo 4, así una
 * serie de "un día con una visita" no dibuja un pico que ocupa toda la tarjeta.
 */
function techoDe(serie: PuntoSerie[]): number {
  const max = serie.reduce((acc, p) => Math.max(acc, p.visitas), 0);
  if (max <= 4) return 4;
  const escalon = max <= 20 ? 5 : max <= 100 ? 10 : 50;
  return Math.ceil((max * 1.15) / escalon) * escalon;
}

interface GraficoVisitasProps {
  serie: PuntoSerie[];
  /** Sufijo para los `id` del SVG: dos gradientes con el mismo id se pisan. */
  idGradiente?: string;
}

/** Área de 30 días con eje y referencias. Se renderiza en el servidor. */
export function GraficoVisitas({ serie, idGradiente = "visitas" }: GraficoVisitasProps) {
  const ANCHO = 720;
  const ALTO = 200;
  const techo = techoDe(serie);
  const puntos = coordenadas(serie, ANCHO, ALTO, techo);
  const linea = rutaMonotona(puntos);
  const area = `${linea} L ${ANCHO} ${ALTO} L 0 ${ALTO} Z`;

  const indicePico = serie.reduce(
    (mejor, punto, i) => (punto.visitas > serie[mejor].visitas ? i : mejor),
    0
  );
  const hayDatos = serie.some((p) => p.visitas > 0);

  return (
    <div>
      <div className="relative">
        {/* Referencias del eje Y. Van en HTML y no en el SVG porque el SVG se
            estira sin conservar proporción y el texto saldría deformado. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-8 flex-col justify-between py-[2px] text-right">
          <span className="text-[10px] font-semibold tabular-nums text-slate-300">{techo}</span>
          <span className="text-[10px] font-semibold tabular-nums text-slate-300">
            {Math.round(techo / 2)}
          </span>
          <span className="text-[10px] font-semibold tabular-nums text-slate-300">0</span>
        </div>

        <div className="pl-10">
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            preserveAspectRatio="none"
            className="h-[150px] w-full tab:h-[180px]"
            role="img"
            aria-label={`Visitas diarias a tu ficha en los últimos ${serie.length} días`}
          >
            <defs>
              <linearGradient id={`grad-${idGradiente}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grilla. `non-scaling-stroke` mantiene el 1px real aunque el SVG
                se estire horizontalmente. */}
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1="0"
                x2={ANCHO}
                y1={ALTO * f}
                y2={ALTO * f}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={f === 1 ? undefined : "4 6"}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {hayDatos && (
              <>
                <path d={area} fill={`url(#grad-${idGradiente})`} />
                <path
                  d={linea}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
          </svg>
        </div>

        {/* El punto del día pico va en HTML, encima del SVG: dentro del SVG
            estirado sería un óvalo. */}
        {hayDatos && serie.length > 1 && (
          <span
            className="pointer-events-none absolute block h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
            style={{
              left: `calc(2.5rem + (100% - 2.5rem) * ${indicePico / (serie.length - 1)})`,
              top: `${(puntos[indicePico].y / ALTO) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden
          />
        )}
      </div>

      {/* Eje X: tres marcas. Con 30 etiquetas no se lee ninguna. */}
      <div className="mt-2.5 flex justify-between pl-10 text-[10px] font-semibold text-slate-400">
        <span>{etiquetaDia(serie[0].dia)}</span>
        <span className="hidden tab:inline">
          {etiquetaDia(serie[Math.floor(serie.length / 2)].dia)}
        </span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

interface SparklineProps {
  serie: PuntoSerie[];
  className?: string;
  color?: string;
}

/**
 * La misma serie, del tamaño de un renglón, para la tarjeta de KPI.
 *
 * Sólo la usa la tarjeta de visitas: es la única métrica del panel con serie
 * temporal real. Dibujarle una línea a un KPI que no la tiene sería inventar
 * una tendencia.
 */
export function Sparkline({ serie, className = "", color = "#2563eb" }: SparklineProps) {
  if (!serie.some((p) => p.visitas > 0)) return null;

  const ANCHO = 120;
  const ALTO = 32;
  const techo = techoDe(serie);
  const linea = rutaMonotona(coordenadas(serie, ANCHO, ALTO - 3, techo));

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <path
        d={linea}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
