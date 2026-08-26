import { Eye, TrendingUp } from "lucide-react";

/**
 * Maqueta del panel nuevo para el cartel de la novedad.
 *
 * Los otros tres carteles muestran una maqueta dibujada de lo que anuncian —la
 * tarjeta de oportunidad, la cabecera de la ficha— porque se entiende mejor
 * viéndola que leyendo tres bullets. Este es el equivalente para el panel.
 *
 * ES UN DIBUJO, NO DATOS. La curva y el número son de ejemplo, igual que en las
 * otras maquetas: no salen de `visitas_perfil` ni de ninguna consulta. Vive en
 * `src/modulos/` y no en `src/components/`, así que queda fuera del alcance de
 * `sin-datos-inventados.test.ts` — que es lo correcto, porque una maqueta de un
 * cartel no es una afirmación sobre el padrón. Aun así no lleva ningún nombre
 * de empresa ni cifra sobre la red.
 */
export function MaquetaPanel() {
  // Perfil de la curva del dibujo. Se declara acá y no inline para que quede
  // claro de un vistazo que es una forma elegida, no una serie consultada.
  const FORMA = [3, 5, 4, 7, 6, 9, 7, 12, 9, 14, 11, 16, 13, 18];
  const ANCHO = 240;
  const ALTO = 56;
  const techo = Math.max(...FORMA) * 1.15;
  const puntos = FORMA.map((v, i) => {
    const x = (i / (FORMA.length - 1)) * ANCHO;
    const y = ALTO - (v / techo) * ALTO;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linea = `M ${puntos.join(" L ")}`;
  const area = `${linea} L ${ANCHO},${ALTO} L 0,${ALTO} Z`;

  return (
    <div className="rounded-xl bg-[#f2f5f8] p-3 ring-1 ring-slate-200/70" aria-hidden>
      {/* Tarjeta de KPI, como las del "Resumen general" */}
      <div className="rounded-lg border border-slate-200/60 bg-white p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50">
              <Eye className="h-3.5 w-3.5 text-violet-500" />
            </span>
            <span className="font-poppins text-[22px] font-black leading-none tracking-tight text-[#00213f]">
              32
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-black text-emerald-600">
            +18%
            <TrendingUp className="h-2.5 w-2.5" />
          </span>
        </div>
        <p className="mt-2.5 text-[11px] font-bold text-[#00213f]">Visitas a tu ficha</p>
        <p className="text-[10px] text-slate-400">En los últimos 30 días</p>
      </div>

      {/* Gráfico, como el de "Estadísticas de visibilidad" */}
      <div className="mt-2 rounded-lg border border-slate-200/60 bg-white p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
          Visitas por día
        </p>
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          preserveAspectRatio="none"
          className="h-12 w-full"
          role="presentation"
        >
          <defs>
            <linearGradient id="maquetaPanelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#maquetaPanelGrad)" />
          <path
            d={linea}
            fill="none"
            stroke="#2563eb"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
