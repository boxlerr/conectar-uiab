/**
 * `server-only` existe para que Next falle el build si un módulo de servidor se
 * importa desde el browser. En vitest ese mismo paquete tira al importarse
 * —el entorno es jsdom, o sea "el browser"— y volvía intesteable todo lo que lo
 * usa: los precios, el cliente de Sipago, la acreditación de pagos.
 *
 * El alias vive en vitest.config.ts. La garantía real la sigue dando el build.
 */
export {};
