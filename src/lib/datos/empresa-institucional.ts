/**
 * La UIAB tiene ficha propia en el directorio (es la institución real, no una
 * demo: ver /empresas/union-industrial-de-almirante-brown), pero NO va en los
 * sliders de "empresas socias": es la que creó la plataforma, no una
 * participante más. Pedido de comunicación@uiab.org, 2026-08-02.
 *
 * Se filtra por UUID a propósito:
 *  - `razon_social` lleva tilde ("UNIÓN INDUSTRIAL...") y cualquier match por
 *    texto sin normalizar falla en silencio.
 *  - `ruta_logo` NO sirve: 49 de las 51 socias tienen el archivo llamado
 *    literalmente `logo-uiab.png` (convención de la carga masiva del padrón),
 *    así que un filtro por nombre de archivo vaciaría el slider entero.
 */
export const EMPRESA_UIAB_ID = "7221a1d7-006d-4587-b9e4-753c0c9a229d";

/** true si la fila es la ficha institucional de la UIAB. */
export function esEmpresaInstitucional(id: string | null | undefined): boolean {
  return id === EMPRESA_UIAB_ID;
}
