import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { jsonLdBreadcrumbs, type Miga } from "@/lib/seo/breadcrumbs";

/**
 * Miga de navegación visible + su BreadcrumbList.
 *
 * Van juntos a propósito: el marcado tiene que describir algo que el usuario
 * efectivamente ve, y la miga tiene que tener enlaces de verdad para que sirva
 * como camino de rastreo. Separarlos es la forma clásica de terminar con
 * marcado que no coincide con el contenido.
 */
export function Migas({
  migas,
  className = "",
  tono = "oscuro",
}: {
  migas: Miga[];
  className?: string;
  /** "claro" para heros con fondo azul; "oscuro" para fondo blanco. */
  tono?: "claro" | "oscuro";
}) {
  if (migas.length === 0) return null;

  const base = tono === "claro" ? "text-white/60" : "text-slate-500";
  const enlace =
    tono === "claro"
      ? "text-white/80 hover:text-white"
      : "text-slate-600 hover:text-primary-600";
  const actual = tono === "claro" ? "text-white" : "text-[#00213f]";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs(migas)) }}
      />
      <nav aria-label="Ruta de navegación" className={className}>
        <ol className={`flex flex-wrap items-center gap-1.5 text-[12px] ${base}`}>
          {migas.map((m, i) => {
            const ultima = i === migas.length - 1;
            return (
              <li key={`${m.nombre}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" aria-hidden />}
                {m.href && !ultima ? (
                  <Link href={m.href} className={`${enlace} transition-colors`}>
                    {m.nombre}
                  </Link>
                ) : (
                  <span className={`${actual} font-semibold`} aria-current={ultima ? "page" : undefined}>
                    {m.nombre}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
