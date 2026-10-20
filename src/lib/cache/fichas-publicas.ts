import { revalidatePath } from "next/cache";

/**
 * Invalida las fichas públicas (/empresas/[slug]) en el caché del CDN.
 *
 * Las fichas son ISR: salen del CDN y se regeneran cada `revalidate` segundos.
 * Sin esto, una socia que guarda sus datos y abre su ficha vería la versión
 * vieja hasta el próximo ciclo. Se invalida el layout de /empresas (todas las
 * fichas) y no sólo la de quien guardó: el slug sale de la razón social, que se
 * puede estar cambiando en el mismo guardado, y regenerar ~60 páginas a medida
 * que alguien las visita no cuesta nada. Es lo mismo que ya hacía el admin.
 *
 * Llamarlo DESPUÉS de escribir en la base: antes, una regeneración que se
 * cruce volvería a cachear lo viejo.
 */
export function revalidarFichasPublicas() {
  revalidatePath("/empresas", "layout");
}
