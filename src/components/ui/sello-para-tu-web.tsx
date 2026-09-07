"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { SITE_URL } from "@/lib/seo/entidad";

/**
 * El bloque que le permite a una socia poner el sello del directorio en SU web.
 *
 * POR QUÉ ESTO ES SEO Y NO UNA DECORACIÓN
 *
 * Google autocorrige "UIAB Conecta" a "IAB Conecta" porque el nombre no aparece
 * escrito en ningún dominio que no sea éste, y sin corroboración externa el
 * corrector no tiene con qué desempatar contra iabconecta.com. Las ~52 socias
 * con web propia son la única fuente de menciones que la UIAB controla a escala
 * y sin pagar: dominios argentinos, industriales, de la zona.
 *
 * La línea de TEXTO es la que cuenta. El logo solo no aporta nada —Google no
 * lee lo que dice una imagen—, así que el snippet siempre lleva la frase con el
 * nombre escrito y los dos enlaces. Si alguien lo recorta, que recorte la
 * imagen, nunca el texto.
 *
 * POR QUÉ /e/{id} Y NO /empresas/{slug}
 *
 * El slug se calcula del nombre en cada render y no está en la base: renombrar
 * la empresa le cambia la URL. Estos enlaces van a vivir en sitios ajenos que no
 * vamos a poder editar, así que tienen que apuntar a algo estable. Ver el
 * comentario largo de src/app/e/[id]/route.ts.
 *
 * Vive en /perfil (noindex) y no en la ficha pública: en la ficha le hablaría a
 * un lector de cada mil y sumaría markup a 59 páginas indexables.
 */
export function SelloParaTuWeb({
  entidadId,
  nombre,
}: {
  entidadId: string;
  nombre?: string | null;
}) {
  const [copiado, setCopiado] = useState(false);

  const url = `${SITE_URL}/e/${entidadId}`;
  const snippet = `<a href="${url}">
  <img src="${SITE_URL}/sello-uiab-conecta.svg"
       alt="Socia verificada de UIAB Conecta" width="220" height="72">
</a>
<p>Socia verificada de <a href="${SITE_URL}">UIAB Conecta</a>, el directorio
industrial de la Unión Industrial de Almirante Brown.</p>`;

  function copiar() {
    navigator.clipboard.writeText(snippet).then(
      () => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1800);
      },
      () =>
        toast.error("No se pudo copiar", {
          description: "Seleccionalo con el mouse y copialo a mano.",
        })
    );
  }

  return (
    <Card className="p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Poné el sello en tu web</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-prose">
            Pegá este código en el pie de tu sitio. Muestra que{" "}
            {nombre ? <strong>{nombre}</strong> : "tu empresa"} está verificada y
            enlaza a tu ficha — y de paso ayuda a que el directorio aparezca en
            Google cuando alguien busca proveedores de la zona.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 shrink-0"
        >
          Ver mi ficha <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-5 mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- es el archivo
            exacto que se le entrega a la socia; optimizarlo mostraría algo
            distinto de lo que va a ver en su web. */}
        <img
          src="/sello-uiab-conecta.svg"
          alt="Socia verificada de UIAB Conecta"
          width={220}
          height={72}
        />
        <p className="text-xs text-slate-400 max-w-[22rem]">
          Si tu web no acepta SVG, pedinos el sello en PNG. Lo que no conviene
          recortar es la línea de texto: es la parte que Google lee.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between gap-3 bg-slate-50 border-b border-slate-200 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            HTML para el pie de tu sitio
          </span>
          <button
            type="button"
            onClick={copiar}
            aria-label="Copiar el código del sello"
            className={
              "flex items-center gap-1.5 text-xs font-semibold rounded-lg border px-2.5 py-1 transition-colors " +
              (copiado
                ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                : "text-primary-600 border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50")
            }
          >
            {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre className="p-3 text-[11.5px] leading-relaxed text-slate-700 bg-white overflow-x-auto">
          <code>{snippet}</code>
        </pre>
      </div>
    </Card>
  );
}
