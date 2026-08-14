/**
 * El servicio que declara quien se registra.
 *
 * Es obligatorio, y hasta ahora sólo lo pedía el wizard: `register-sync` hacía
 * `if (sectorId)` y seguía de largo si no venía. Un POST armado a mano —o un
 * paso que el navegador no revalidó— dejaba una ficha sin rubro, que es una
 * ficha invisible: no aparece en ninguna búsqueda del directorio.
 *
 * Se puede elegir del catálogo o escribir uno propio. Lo escrito entra como
 * propuesta (`administrado_por_admin = false`) y el admin lo sube al catálogo
 * cuando aprueba la ficha, igual que con las empresas.
 */

import {
  limpiarNombreEspecialidad,
  slugEspecialidad,
  validarEspecialidadLibre,
} from "@/modulos/compartido/especialidades";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ServicioDelRegistro =
  | { tipo: "catalogo"; categoriaId: string }
  | { tipo: "libre"; nombre: string; slug: string }
  | { tipo: "falta"; error: string };

export const ERROR_SIN_SERVICIO =
  "Elegí el servicio que ofrecés, o escribilo si no está en la lista.";

/**
 * Decide qué hacer con lo que mandó el formulario, sin tocar la base.
 *
 * El id del catálogo gana sobre el texto libre: si eligió una categoría real,
 * lo que haya quedado escrito en el otro campo es residuo.
 */
export function interpretarServicioDelRegistro(
  sectorId: unknown,
  servicioLibre: unknown
): ServicioDelRegistro {
  if (typeof sectorId === "string" && UUID.test(sectorId.trim())) {
    return { tipo: "catalogo", categoriaId: sectorId.trim() };
  }

  const texto =
    typeof servicioLibre === "string" ? limpiarNombreEspecialidad(servicioLibre) : "";
  if (!texto) return { tipo: "falta", error: ERROR_SIN_SERVICIO };

  const invalido = validarEspecialidadLibre(texto);
  if (invalido) return { tipo: "falta", error: invalido };

  return { tipo: "libre", nombre: texto, slug: slugEspecialidad(texto) };
}
