/**
 * ─── Catálogo de normas y certificaciones (Conectar UIAB) ───────────────────
 *
 * Módulo de datos PLANO: sin `"use client"` y sin `import "server-only"`. Lo
 * importan a la vez el pipeline server-side del directorio (`datos.ts`, admin
 * client) y componentes client (las 4 páginas por categoría + la tarjeta). Si
 * este catálogo viviera dentro de un módulo `server-only`, importarlo desde un
 * client component rompería la hidratación en silencio (gotcha Next 16 +
 * Turbopack).
 *
 * El catálogo es una constante TypeScript y NO una tabla: además del nombre, el
 * chip necesita familia, ícono lucide y clases Tailwind estáticas, que son
 * código, no datos. Sumar una norma nueva es un deploy (se toca ~1 vez por año);
 * el caso raro se cubre con `otra` + nombre libre.
 *
 * ⚠️ Legal: los logos oficiales de ISO y de las certificadoras (IRAM, TÜV,
 * Bureau Veritas, SGS…) son marcas registradas. Acá NO se usan: el chip es un
 * badge propio (código de la norma + ícono genérico por familia).
 */

export type FamiliaNorma =
  | "calidad"
  | "ambiente"
  | "seguridad"
  | "alimentos"
  | "producto"
  | "habilitacion"
  | "otras";

export interface Norma {
  /** Clave estable que se persiste en `certificaciones.codigo_norma`. */
  codigo: string;
  /** Lo que se ve en el chip: "ISO 9001". */
  etiqueta: string;
  /** Nombre completo, para la ficha y el `<select>`. */
  nombre: string;
  familia: FamiliaNorma;
}

/**
 * Metadata visual por familia. Presentación (código, no datos): color e ícono.
 * Los nombres de ícono son claves de lucide-react resueltas en `<ChipNorma>`.
 * Clases Tailwind COMPLETAS y estáticas (nunca interpolar colores en Tailwind).
 */
export const FAMILIA_META: Record<
  FamiliaNorma,
  { etiqueta: string; icono: string; chip: string; punto: string; suave: string }
> = {
  calidad: {
    etiqueta: "Calidad y gestión",
    icono: "BadgeCheck",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    punto: "bg-blue-500",
    suave: "bg-blue-50 text-blue-700",
  },
  ambiente: {
    etiqueta: "Ambiente y energía",
    icono: "Leaf",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    punto: "bg-emerald-500",
    suave: "bg-emerald-50 text-emerald-700",
  },
  seguridad: {
    etiqueta: "Seguridad y salud",
    icono: "HardHat",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    punto: "bg-amber-500",
    suave: "bg-amber-50 text-amber-700",
  },
  alimentos: {
    etiqueta: "Alimentos e inocuidad",
    icono: "Utensils",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    punto: "bg-rose-500",
    suave: "bg-rose-50 text-rose-700",
  },
  producto: {
    etiqueta: "Producto y conformidad",
    icono: "Stamp",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    punto: "bg-violet-500",
    suave: "bg-violet-50 text-violet-700",
  },
  habilitacion: {
    etiqueta: "Habilitaciones y registros",
    icono: "Landmark",
    chip: "bg-teal-50 text-teal-700 border-teal-200",
    punto: "bg-teal-500",
    suave: "bg-teal-50 text-teal-700",
  },
  otras: {
    etiqueta: "Otras",
    icono: "Award",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    punto: "bg-slate-400",
    suave: "bg-slate-100 text-slate-600",
  },
};

/** Código estable de la escotilla "Otra" (nombre escrito por la socia). */
export const CODIGO_OTRA = "otra";

export const NORMAS: readonly Norma[] = [
  // ── Calidad y gestión ──
  { codigo: "iso-9001", etiqueta: "ISO 9001", nombre: "Sistema de gestión de la calidad", familia: "calidad" },
  { codigo: "iatf-16949", etiqueta: "IATF 16949", nombre: "Calidad para la industria automotriz", familia: "calidad" },
  { codigo: "iso-3834", etiqueta: "ISO 3834", nombre: "Calidad en soldadura por fusión", familia: "calidad" },
  { codigo: "iso-17025", etiqueta: "ISO 17025", nombre: "Competencia de laboratorios de ensayo y calibración", familia: "calidad" },
  { codigo: "iso-13485", etiqueta: "ISO 13485", nombre: "Calidad para productos médicos", familia: "calidad" },
  { codigo: "iso-27001", etiqueta: "ISO 27001", nombre: "Gestión de la seguridad de la información", familia: "calidad" },

  // ── Ambiente y energía ──
  { codigo: "iso-14001", etiqueta: "ISO 14001", nombre: "Sistema de gestión ambiental", familia: "ambiente" },
  { codigo: "iso-50001", etiqueta: "ISO 50001", nombre: "Gestión de la energía", familia: "ambiente" },
  { codigo: "fsc-coc", etiqueta: "FSC CoC", nombre: "Cadena de custodia FSC", familia: "ambiente" },

  // ── Seguridad y salud ──
  { codigo: "iso-45001", etiqueta: "ISO 45001", nombre: "Seguridad y salud en el trabajo", familia: "seguridad" },
  { codigo: "iram-3800", etiqueta: "IRAM 3800", nombre: "Seguridad y salud ocupacional", familia: "seguridad" },

  // ── Alimentos e inocuidad ──
  { codigo: "bpm", etiqueta: "BPM", nombre: "Buenas Prácticas de Manufactura", familia: "alimentos" },
  { codigo: "haccp", etiqueta: "HACCP", nombre: "Análisis de peligros y puntos críticos de control", familia: "alimentos" },
  { codigo: "iso-22000", etiqueta: "ISO 22000", nombre: "Inocuidad de los alimentos", familia: "alimentos" },
  { codigo: "fssc-22000", etiqueta: "FSSC 22000", nombre: "Certificación de seguridad alimentaria", familia: "alimentos" },
  { codigo: "brcgs", etiqueta: "BRCGS", nombre: "Norma mundial de seguridad alimentaria", familia: "alimentos" },
  { codigo: "kosher", etiqueta: "Kosher", nombre: "Certificación kosher", familia: "alimentos" },
  { codigo: "halal", etiqueta: "Halal", nombre: "Certificación halal", familia: "alimentos" },

  // ── Producto y conformidad ──
  { codigo: "sello-iram", etiqueta: "Sello IRAM", nombre: "Sello de conformidad con norma IRAM", familia: "producto" },
  { codigo: "seguridad-electrica", etiqueta: "Seguridad eléctrica", nombre: "Seguridad eléctrica — Res. SC 169/2018", familia: "producto" },
  { codigo: "marca-conformidad", etiqueta: "Marca de conformidad", nombre: "Marca de conformidad de producto", familia: "producto" },
  { codigo: "marcado-ce", etiqueta: "Marcado CE", nombre: "Conformidad Europea", familia: "producto" },

  // ── Habilitaciones y registros ──
  { codigo: "inti", etiqueta: "INTI", nombre: "Ensayo o certificación INTI", familia: "habilitacion" },
  { codigo: "anmat", etiqueta: "ANMAT", nombre: "Habilitación / registro ANMAT", familia: "habilitacion" },
  { codigo: "senasa", etiqueta: "SENASA", nombre: "Registro / habilitación SENASA", familia: "habilitacion" },
  { codigo: "enargas", etiqueta: "ENARGAS", nombre: "Homologación ENARGAS", familia: "habilitacion" },
  { codigo: "opds", etiqueta: "OPDS", nombre: "Aptitud ambiental (OPDS, Prov. Bs. As.)", familia: "habilitacion" },
  { codigo: "renpre", etiqueta: "RENPRE", nombre: "Registro Nacional de Precursores Químicos", familia: "habilitacion" },

  // ── Escotilla ──
  { codigo: CODIGO_OTRA, etiqueta: "Otra", nombre: "Otra norma o certificación", familia: "otras" },
];

const NORMAS_POR_CODIGO: ReadonlyMap<string, Norma> = new Map(
  NORMAS.map((n) => [n.codigo, n])
);

/** Normas agrupadas por familia, en el orden del catálogo. Para el `<select>`. */
export const NORMAS_POR_FAMILIA: { familia: FamiliaNorma; etiqueta: string; normas: Norma[] }[] =
  (Object.keys(FAMILIA_META) as FamiliaNorma[])
    .map((familia) => ({
      familia,
      etiqueta: FAMILIA_META[familia].etiqueta,
      normas: NORMAS.filter((n) => n.familia === familia && n.codigo !== CODIGO_OTRA),
    }))
    .filter((g) => g.normas.length > 0);

/**
 * Atajos del empty state: las normas más frecuentes de una PyME de Almirante
 * Brown. Un click abre el formulario con la norma ya elegida.
 */
export const NORMAS_FRECUENTES: readonly string[] = [
  "iso-9001",
  "iso-14001",
  "iso-45001",
  "bpm",
  "iatf-16949",
  "haccp",
];

export function normaPorCodigo(codigo: string | null | undefined): Norma | undefined {
  if (!codigo) return undefined;
  return NORMAS_POR_CODIGO.get(codigo);
}

/**
 * Etiqueta a mostrar para una fila: la del catálogo, o el nombre libre cuando la
 * norma es "otra".
 */
export function etiquetaNorma(codigo: string, nombreLibre?: string | null): string {
  if (codigo === CODIGO_OTRA) return (nombreLibre || "").trim() || "Certificación";
  return normaPorCodigo(codigo)?.etiqueta || (nombreLibre || "").trim() || "Certificación";
}

export function familiaNorma(codigo: string): FamiliaNorma {
  return normaPorCodigo(codigo)?.familia ?? "otras";
}

// ─── Vigencia ────────────────────────────────────────────────────────────────

export type EstadoVigencia = "sin_vencimiento" | "vigente" | "por_vencer" | "vencida";

/** Umbral (días) para avisar "vence pronto". */
export const DIAS_POR_VENCER = 60;

/**
 * Estado de vigencia a partir de la fecha de vencimiento ("YYYY-MM-DD" o null).
 * Puro y determinista: se le puede pasar `hoy` para testear.
 */
export function estadoVigencia(
  fechaVencimiento: string | null | undefined,
  hoy: Date = new Date()
): EstadoVigencia {
  if (!fechaVencimiento) return "sin_vencimiento";
  const venc = new Date(`${fechaVencimiento}T00:00:00`);
  if (Number.isNaN(venc.getTime())) return "sin_vencimiento";
  const ref = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.floor((venc.getTime() - ref.getTime()) / 86_400_000);
  if (dias < 0) return "vencida";
  if (dias <= DIAS_POR_VENCER) return "por_vencer";
  return "vigente";
}

// ─── Chips del directorio ────────────────────────────────────────────────────

/** Forma mínima que consume la tarjeta del directorio y la ficha. */
export interface CertificacionChip {
  codigo: string;
  etiqueta: string;
  familia: FamiliaNorma;
  verificada: boolean;
}

/** Columnas mínimas que traen las queries del directorio. */
export const SELECT_CERTIFICACIONES_DIRECTORIO =
  "empresa_id, proveedor_id, codigo_norma, nombre_libre, verificada";

interface FilaCertDirectorio {
  empresa_id?: string | null;
  proveedor_id?: string | null;
  codigo_norma: string;
  nombre_libre?: string | null;
  verificada?: boolean | null;
}

/**
 * Agrupa filas crudas de `certificaciones` en un Map por id de entidad
 * (empresa_id || proveedor_id). Las verificadas primero. Deduplica por etiqueta
 * para que "Otra" repetida no cargue la tarjeta.
 */
export function mapearCertificaciones(
  filas: FilaCertDirectorio[] | null | undefined
): Map<string, CertificacionChip[]> {
  const mapa = new Map<string, CertificacionChip[]>();
  for (const f of filas ?? []) {
    const id = f.empresa_id || f.proveedor_id;
    if (!id || !f.codigo_norma) continue;
    const chip: CertificacionChip = {
      codigo: f.codigo_norma,
      etiqueta: etiquetaNorma(f.codigo_norma, f.nombre_libre),
      familia: familiaNorma(f.codigo_norma),
      verificada: !!f.verificada,
    };
    const actual = mapa.get(id) ?? [];
    actual.push(chip);
    mapa.set(id, actual);
  }
  // Verificadas primero, después por etiqueta.
  for (const [id, chips] of mapa) {
    chips.sort((a, b) => {
      if (a.verificada !== b.verificada) return a.verificada ? -1 : 1;
      return a.etiqueta.localeCompare(b.etiqueta, "es");
    });
    mapa.set(id, chips);
  }
  return mapa;
}
