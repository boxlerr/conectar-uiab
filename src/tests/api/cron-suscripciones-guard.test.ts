import { describe, it, expect } from "vitest";
import { puedeCorrerElCron } from "@/app/api/cron/suscripciones/route";

/**
 * El cron manda mails de mora y suspensión y cambia el estado de las
 * suscripciones. Quién puede dispararlo no es un detalle de configuración.
 */
describe("quién puede correr el cron de suscripciones", () => {
  const SECRETO = "un-secreto-largo";

  it("sin CRON_SECRET configurado no corre nadie", () => {
    // Falla CERRADO. La versión anterior hacía `if (secret && ...)`: sin la
    // variable definida se salteaba el chequeo entero y el endpoint quedaba
    // abierto a internet — que es exactamente el estado en el que estaba el
    // proyecto de Vercel, donde CRON_SECRET no existe.
    expect(puedeCorrerElCron(undefined, null, null)).toBe(false);
    expect(puedeCorrerElCron(undefined, "lo-que-sea", null)).toBe(false);
    expect(puedeCorrerElCron("", null, "Bearer lo-que-sea")).toBe(false);
  });

  it("acepta el secreto por x-cron-secret", () => {
    expect(puedeCorrerElCron(SECRETO, SECRETO, null)).toBe(true);
  });

  it("acepta el secreto por Authorization: Bearer, que es como lo manda Vercel", () => {
    expect(puedeCorrerElCron(SECRETO, null, `Bearer ${SECRETO}`)).toBe(true);
    expect(puedeCorrerElCron(SECRETO, null, `bearer ${SECRETO}`)).toBe(true);
  });

  it("rechaza el secreto equivocado y el ausente", () => {
    expect(puedeCorrerElCron(SECRETO, "otro", null)).toBe(false);
    expect(puedeCorrerElCron(SECRETO, null, "Bearer otro")).toBe(false);
    expect(puedeCorrerElCron(SECRETO, null, null)).toBe(false);
    expect(puedeCorrerElCron(SECRETO, "", "")).toBe(false);
  });

  it("no confunde el prefijo Bearer con el secreto", () => {
    expect(puedeCorrerElCron("Bearer", null, "Bearer Bearer")).toBe(true);
    expect(puedeCorrerElCron(SECRETO, null, SECRETO)).toBe(true); // sin prefijo también
  });
});
