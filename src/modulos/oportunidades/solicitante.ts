/**
 * Quién publicó cada oportunidad — con su logo.
 *
 * La cartelera mostraba sólo `razon_social` en texto: una lista de títulos sin
 * ninguna marca visual, donde todas las tarjetas se parecían entre sí. El logo
 * de la socia que publica es el dato que hace escaneable el listado, y ya está
 * en la base (`empresas.bucket_logo` + `empresas.ruta_logo`, las mismas dos
 * columnas que usan el directorio y el marquee de la home).
 *
 * POR QUÉ EL SELECT VIVE ACÁ Y NO EN CADA CONSULTA
 *
 * La misma consulta se hace en dos lados: el Server Component de
 * `/oportunidades` (con la service role, para que Googlebot y el primer paint
 * reciban la cartelera ya armada) y `servicio-oportunidades.ts` (con el cliente
 * del browser, para lo que depende de la sesión). Cuando estaban duplicadas,
 * agregar una columna en una y olvidarla en la otra hacía que el dato
 * apareciera en el HTML del servidor y DESAPARECIERA al revalidar en cliente.
 * Con una sola constante eso no puede pasar.
 *
 * POR QUÉ LA URL SE ARMA A MANO Y NO CON `storage.getPublicUrl()`
 *
 * Para no arrastrar un cliente de Supabase hasta un helper que sólo concatena
 * strings: este módulo lo importan tanto Server Components como componentes de
 * browser. `getPublicUrl` construye exactamente esta misma URL.
 */

export interface EmpresaSolicitante {
  razon_social: string;
  bucket_logo?: string | null;
  ruta_logo?: string | null;
}

export interface ProveedorSolicitante {
  nombre: string;
  nombre_comercial?: string | null;
  bucket_logo?: string | null;
  ruta_logo?: string | null;
}

/**
 * Columnas de una oportunidad de cartelera. Los nombres de los FK son
 * obligatorios: `oportunidades` apunta dos veces a un posible solicitante
 * (empresa o proveedor) y PostgREST no adivina cuál embeber.
 *
 * Se puede escribir en varias líneas y hasta interpolar dentro de otro embed
 * (la consulta de matches la mete en `oportunidad:oportunidades(...)`) porque
 * `select()` de supabase-js borra TODO el espacio en blanco que no esté entre
 * comillas antes de armar la query. Ojo si alguna vez se llama a la REST API a
 * mano con fetch: ahí los saltos de línea sí son un 400 PGRST100.
 */
export const SELECT_OPORTUNIDAD = `
  *,
  categoria:categorias(nombre),
  empresa:empresas!oportunidades_empresa_solicitante_id_fkey(razon_social, bucket_logo, ruta_logo),
  proveedor:proveedores!oportunidades_proveedor_solicitante_id_fkey(nombre, nombre_comercial, bucket_logo, ruta_logo)
`;

/** URL pública de un logo del bucket de imágenes. `null` si falta algún dato. */
export function urlPublicaDeLogo(
  bucket: string | null | undefined,
  ruta: string | null | undefined
): string | null {
  if (!bucket || !ruta) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const rutaSegura = ruta.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${rutaSegura}`;
}

export interface Solicitante {
  /** `null` cuando el join no trajo nada: RLS puede ocultar la contraparte. */
  nombre: string | null;
  /** Letra para el fallback cuando no hay logo (o el archivo no existe). */
  inicial: string;
  logoUrl: string | null;
}

export function solicitanteDe(op: {
  empresa?: EmpresaSolicitante | null;
  proveedor?: ProveedorSolicitante | null;
}): Solicitante {
  const empresa = op.empresa;
  const proveedor = op.proveedor;

  const nombre =
    empresa?.razon_social ??
    proveedor?.nombre_comercial ??
    proveedor?.nombre ??
    null;

  const fuente = empresa ?? proveedor ?? null;

  return {
    nombre,
    inicial: (nombre ?? "?").trim().charAt(0).toUpperCase() || "?",
    logoUrl: urlPublicaDeLogo(fuente?.bucket_logo, fuente?.ruta_logo),
  };
}
