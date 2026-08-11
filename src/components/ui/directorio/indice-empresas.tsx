import Link from "next/link";
import type { Entidad } from "@/lib/datos/directorio";

/**
 * Índice alfabético de todas las socias, renderizado en el SERVIDOR.
 *
 * POR QUÉ EXISTE
 *
 * Medido el 11/08/2026 sobre el HTML servido a Googlebot:
 *
 *   /            → 0 enlaces a /empresas/<slug>
 *   /empresas    → 0
 *   /directorio  → 59
 *   ficha        → 0
 *
 * O sea que el grafo de enlaces del sitio era: home → /directorio → 59 hojas
 * terminales. Las fichas colgaban de un solo documento y no se enlazaban entre
 * sí. Con cero backlinks externos, el enlace interno es el único PageRank que
 * el proyecto controla, y estaba saliendo todo de una sola página.
 *
 * `/empresas` era el peor caso: es la página cuyo trabajo literal es llevar a
 * las fichas, y era un cul-de-sac —la vista con filtros vive en el cliente,
 * detrás del gate de suscripción, así que el crawler veía la landing de
 * marketing y nada más.
 *
 * NO ROMPE EL GATE: nombre, rubro y localidad ya son públicos en /directorio.
 * Lo que sigue detrás del login es el listado con filtros y los datos de
 * contacto, que no están acá.
 *
 * El anchor text es la razón social, que es exactamente la consulta que
 * queremos capturar ("buscan Vaxler y aparece UIAB Conecta").
 */
export function IndiceEmpresas({ entidades }: { entidades: Entidad[] }) {
  if (entidades.length === 0) return null;

  const ordenadas = [...entidades].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );

  // Agrupadas por inicial. Todo lo que no arranque con letra (números,
  // símbolos) cae en "#" para que ninguna quede fuera del índice.
  const grupos = new Map<string, Entidad[]>();
  for (const e of ordenadas) {
    const primera = e.nombre
      .trim()
      .charAt(0)
      .toLocaleUpperCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const clave = /[A-Z]/.test(primera) ? primera : "#";
    const lista = grupos.get(clave);
    if (lista) lista.push(e);
    else grupos.set(clave, [e]);
  }

  return (
    <section
      aria-labelledby="indice-empresas-titulo"
      className="bg-white border-t border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2
          id="indice-empresas-titulo"
          className="font-manrope text-2xl sm:text-3xl font-black text-[#00213f] tracking-tight"
        >
          Todas las empresas socias de la UIAB
        </h2>
        <p className="mt-2 text-slate-600 text-[15px] leading-relaxed max-w-3xl">
          Índice completo de las {ordenadas.length} empresas y prestadores verificados del
          directorio UIAB Conecta, ordenados alfabéticamente. Entrá a cada ficha para ver
          su actividad, rubros, certificaciones y datos de contacto.
        </p>

        <div className="mt-8 space-y-8">
          {[...grupos.entries()].map(([letra, lista]) => (
            <div key={letra}>
              <h3 className="font-manrope text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-3">
                {letra}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                {lista.map((e) => (
                  <li key={e.slug} className="text-[14px] leading-snug">
                    <Link
                      href={`/empresas/${e.slug}`}
                      className="text-[#00213f] font-semibold hover:text-primary-600 hover:underline underline-offset-2"
                    >
                      {e.nombre}
                    </Link>
                    {(e.categoria || e.ubicacion) && (
                      <span className="text-slate-500">
                        {" — "}
                        {[e.categoria, e.ubicacion].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
