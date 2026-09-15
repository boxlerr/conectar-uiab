/**
 * CUIT: normalización, formato y dígito verificador.
 *
 * POR QUÉ EXISTE
 *
 * El registro pedía el CUIT con `maxLength={11}` y un onChange que borraba todo
 * lo que no fuera dígito. Suena razonable y es una trampa: cuando alguien pega
 * "30-71232689-8" (13 caracteres), el navegador corta en 11 ANTES de que corra
 * el onChange, así que quedan "30-71232689" y después de limpiar los guiones
 * sobreviven 10 dígitos. La persona ve su CUIT cortado, no entiende por qué, y
 * el mensaje de error le dice "debe contener exactamente 11 números" — como si
 * se hubiera equivocado ella. Copiar y pegar el CUIT desde una factura es
 * exactamente lo que va a hacer todo el mundo.
 *
 * Y el segundo problema: un CUIT con un dígito mal escrito pasaba la validación
 * entera. Entra a la ficha publicada, no matchea contra el padrón (así que a una
 * socia se le cobra) y rompe la conciliación por CUIT de Sipago: la empresa paga
 * y el pago no se le imputa a nadie.
 *
 * Módulo puro, sin imports y sin "server-only": lo usa el formulario en el
 * browser y también se puede revalidar en el servidor.
 */

/** Sólo los dígitos, cortados a los 11 que tiene un CUIT. */
export function soloDigitosCuit(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 11);
}

/**
 * Lo escribe como se lee en una factura: 30-71232689-8.
 * Va formateando a medida que la persona tipea, sin exigirle los guiones.
 */
export function formatearCuit(valor: string): string {
  const d = soloDigitosCuit(valor);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

/** Los dos primeros dígitos válidos de un CUIT/CUIL argentino. */
const PREFIJOS_VALIDOS = new Set(["20", "23", "24", "27", "30", "33", "34"]);

/** Pesos del módulo 11, en orden, para los primeros 10 dígitos. */
const PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Valida el dígito verificador (módulo 11).
 *
 * El último dígito de un CUIT se calcula a partir de los otros diez, así que un
 * error de tipeo se detecta sin consultar nada: es la misma cuenta que hace
 * ARCA. Devuelve false también si el prefijo no es uno de los válidos.
 */
export function cuitValido(valor: string): boolean {
  const d = soloDigitosCuit(valor);
  if (d.length !== 11) return false;
  if (!PREFIJOS_VALIDOS.has(d.slice(0, 2))) return false;

  const suma = PESOS.reduce((acc, peso, i) => acc + peso * Number(d[i]), 0);
  const resto = suma % 11;
  // La regla de ARCA para los dos casos de borde: resto 0 → verificador 0;
  // resto 1 → verificador 9 (y el prefijo pasa a ser 23 en los CUIL, pero eso
  // ya viene dado en el número que nos escriben).
  const esperado = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
  return esperado === Number(d[10]);
}
