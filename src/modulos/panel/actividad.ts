/**
 * "Actividad reciente": la línea de tiempo de la ficha.
 *
 * NO HAY TABLA DE ACTIVIDAD. `auditoria` existe con las columnas justas para
 * esto y tiene cero filas: nadie escribe en ella. Así que en vez de inventar un
 * log, la línea de tiempo se ARMA con las marcas de tiempo que ya existen —
 * cuándo se creó la ficha, cuándo se aprobó, cuándo se cargó cada ítem, cada
 * certificación, cada oportunidad, cada solicitud recibida.
 *
 * Todos los eventos que salen de acá pasaron de verdad y tienen fecha real. Lo
 * que no se puede reconstruir (por ejemplo "cambiaste el logo": `empresas` sólo
 * guarda un `actualizado_en` global) no se muestra.
 */

export type TipoEvento =
  | "alta"
  | "verificacion"
  | "ficha_editada"
  | "item"
  | "certificacion"
  | "oportunidad"
  | "solicitud";

export interface EventoActividad {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  detalle: string;
  fecha: string;
  /** A dónde lleva el ítem. `null` si no hay una pantalla concreta. */
  href: string | null;
}

interface FuentesActividad {
  entidad: {
    creado_en?: string | null;
    aprobada_en?: string | null;
    aprobado_en?: string | null;
    actualizado_en?: string | null;
  } | null;
  items: { id: string; nombre: string | null; tipo_item: string | null; creado_en: string }[];
  certificaciones: { id: string; etiqueta: string; creado_en: string }[];
  oportunidades: { id: string; titulo: string | null; creado_en: string }[];
  solicitudes: { id: string; origen: string; creado_en: string }[];
}

export function construirActividad(fuentes: FuentesActividad, limite = 6): EventoActividad[] {
  const eventos: EventoActividad[] = [];
  const { entidad } = fuentes;

  for (const item of fuentes.items) {
    eventos.push({
      id: `item-${item.id}`,
      tipo: "item",
      titulo: item.tipo_item === "servicio" ? "Servicio publicado" : "Producto publicado",
      detalle: item.nombre?.trim() || "Sin nombre",
      fecha: item.creado_en,
      href: "/perfil/productos-servicios",
    });
  }

  for (const cert of fuentes.certificaciones) {
    eventos.push({
      id: `cert-${cert.id}`,
      tipo: "certificacion",
      titulo: "Certificación cargada",
      detalle: cert.etiqueta,
      fecha: cert.creado_en,
      href: "/perfil/certificaciones",
    });
  }

  for (const op of fuentes.oportunidades) {
    eventos.push({
      id: `op-${op.id}`,
      tipo: "oportunidad",
      titulo: "Oportunidad publicada",
      detalle: op.titulo?.trim() || "Sin título",
      fecha: op.creado_en,
      href: `/oportunidades/${op.id}`,
    });
  }

  for (const sol of fuentes.solicitudes) {
    eventos.push({
      id: `sol-${sol.id}`,
      tipo: "solicitud",
      titulo: "Solicitud recibida",
      detalle: sol.origen,
      fecha: sol.creado_en,
      href: "/perfil/solicitudes",
    });
  }

  if (entidad) {
    const aprobada = entidad.aprobada_en || entidad.aprobado_en;

    // Sólo si la edición es POSTERIOR al alta: al crearse la ficha, la base
    // deja `actualizado_en` igual que `creado_en` y saldría un "editaste tu
    // ficha" que nadie hizo. Un minuto de margen alcanza.
    if (
      entidad.actualizado_en &&
      entidad.creado_en &&
      Date.parse(entidad.actualizado_en) - Date.parse(entidad.creado_en) > 60_000
    ) {
      eventos.push({
        id: "ficha-editada",
        tipo: "ficha_editada",
        titulo: "Ficha actualizada",
        detalle: "Se modificaron los datos de tu perfil",
        fecha: entidad.actualizado_en,
        href: "/perfil/datos",
      });
    }

    if (aprobada) {
      eventos.push({
        id: "verificacion",
        tipo: "verificacion",
        titulo: "Empresa verificada",
        detalle: "Tu ficha quedó publicada en el directorio",
        fecha: aprobada,
        href: null,
      });
    }

    if (entidad.creado_en) {
      eventos.push({
        id: "alta",
        tipo: "alta",
        titulo: "Te sumaste a UIAB Conecta",
        detalle: "Se creó tu ficha en la plataforma",
        fecha: entidad.creado_en,
        href: null,
      });
    }
  }

  return eventos
    .filter((e) => Number.isFinite(Date.parse(e.fecha)))
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))
    .slice(0, limite);
}

/** "Hace 2 horas" / "Hace 3 días" — el formato del mockup, en oración. */
export function haceCuanto(fecha: string): string {
  const diff = Date.now() - Date.parse(fecha);
  const min = Math.floor(diff / 60_000);
  if (min < 2) return "Recién";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} ${d === 1 ? "día" : "días"}`;
  const sem = Math.floor(d / 7);
  if (d < 30) return `Hace ${sem} ${sem === 1 ? "semana" : "semanas"}`;
  const m = Math.floor(d / 30);
  if (m < 12) return `Hace ${m} ${m === 1 ? "mes" : "meses"}`;
  return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}
