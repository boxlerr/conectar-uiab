import { describe, it, expect } from "vitest";
import {
  diaDeVista,
  esUserAgentDeBot,
  esUuid,
  idVisitante,
  ipDelPedido,
} from "@/modulos/boletin/vistas-reglas";

/**
 * El contador de vistas del Boletín cuenta personas por día. Lo que se cubre:
 * que los rastreadores no sumen, que el mismo visitante el mismo día dé el
 * mismo id (el dedup lo hace la clave primaria con eso), que cambie al día
 * siguiente, y que del id anónimo no se pueda leer la IP.
 */

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

describe("esUserAgentDeBot", () => {
  it("deja pasar navegadores de verdad", () => {
    expect(esUserAgentDeBot(CHROME)).toBe(false);
    expect(esUserAgentDeBot(IPHONE)).toBe(false);
  });

  it("frena a los rastreadores que corren JS y a los previews", () => {
    for (const ua of [
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.70 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Chrome-Lighthouse",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/129.0.0.0 Safari/537.36",
      "WhatsApp/2.23.20.0",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "curl/8.7.1",
      "python-requests/2.32.3",
    ]) {
      expect(esUserAgentDeBot(ua), ua).toBe(true);
    }
  });

  it("sin user agent no es un navegador", () => {
    expect(esUserAgentDeBot("")).toBe(true);
    expect(esUserAgentDeBot(null)).toBe(true);
  });
});

describe("idVisitante", () => {
  const base = { perfilId: null, dia: "2026-10-15", ip: "190.2.3.4", userAgent: CHROME, sal: "secreto" };

  it("con sesión es el perfil, en cualquier dispositivo", () => {
    expect(idVisitante({ ...base, perfilId: "abc" })).toBe("u:abc");
    expect(idVisitante({ ...base, perfilId: "abc", userAgent: IPHONE })).toBe("u:abc");
  });

  it("sin sesión: mismo día, misma persona → mismo id", () => {
    expect(idVisitante(base)).toBe(idVisitante({ ...base }));
    expect(idVisitante(base)).toMatch(/^a:[0-9a-f]{32}$/);
  });

  it("cambia de un día al otro, y no contiene la IP", () => {
    expect(idVisitante(base)).not.toBe(idVisitante({ ...base, dia: "2026-10-16" }));
    expect(idVisitante(base)).not.toContain("190.2.3.4");
  });

  it("otra persona detrás de otra IP o con otro navegador es otro id", () => {
    expect(idVisitante(base)).not.toBe(idVisitante({ ...base, ip: "190.2.3.5" }));
    expect(idVisitante(base)).not.toBe(idVisitante({ ...base, userAgent: IPHONE }));
  });
});

describe("diaDeVista", () => {
  it("usa el día de Argentina", () => {
    // 01:30 UTC del 16 son las 22:30 del 15 en Buenos Aires.
    expect(diaDeVista(Date.parse("2026-10-16T01:30:00Z"))).toBe("2026-10-15");
  });
});

describe("ipDelPedido", () => {
  it("toma la primera de x-forwarded-for", () => {
    expect(ipDelPedido(new Headers({ "x-forwarded-for": "190.2.3.4, 10.0.0.1" }))).toBe("190.2.3.4");
    expect(ipDelPedido(new Headers({ "x-real-ip": "190.2.3.9" }))).toBe("190.2.3.9");
    expect(ipDelPedido(new Headers())).toBe("");
  });
});

describe("esUuid", () => {
  it("sólo uuids", () => {
    expect(esUuid("fab6bc0e-1234-4abc-8def-0123456789ab")).toBe(true);
    expect(esUuid("fab6bc0e")).toBe(false);
    expect(esUuid(42)).toBe(false);
    expect(esUuid(undefined)).toBe(false);
  });
});
