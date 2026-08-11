import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  grafoSitio,
  nodoOrganizacionConecta,
  nodoOrganizacionUIAB,
  telefonoE164,
  ID_ORG_UIAB,
  ID_ORG_CONECTA,
} from "@/lib/seo/entidad";
import { jsonLdBreadcrumbs } from "@/lib/seo/breadcrumbs";
import {
  RUBROS_SEO,
  UMBRAL_SOCIAS,
  getRubroSeo,
  landingDeCategoria,
  perteneceAlRubro,
} from "@/lib/datos/rubros-seo";

const RAIZ = process.cwd();
const leer = (...t: string[]) => readFileSync(join(RAIZ, ...t), "utf8");

/**
 * Los comentarios de este repo explican justamente los bugs que se arreglaron
 * ("antes traía los datos con un useEffect", "nada de Math.random()"), así que
 * un assert sobre el archivo crudo se dispara contra su propia documentación.
 * Estas comprobaciones miran el CÓDIGO.
 */
const leerCodigo = (...t: string[]) =>
  leer(...t)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

/**
 * El bug que dejaba la consulta de marca sin resolver.
 *
 * El JSON-LD declaraba UNA organización llamada "UIAB Conecta" con
 * `alternateName: ["Unión Industrial de Almirante Brown", "UIAB"]`, o sea que
 * el directorio afirmaba SER la cámara. Con dos entidades homónimas y ninguna
 * con pruebas externas, Google no elige: le baja la confianza a las dos y
 * resuelve hacia el titular más viejo, que es uiab.org.
 */
describe("identidad de marca", () => {
  const grafo = grafoSitio();
  const nodos = grafo["@graph"] as any[];

  it("son dos organizaciones, no una", () => {
    const orgs = nodos.filter((n) => n["@type"] === "Organization");
    expect(orgs).toHaveLength(2);
  });

  it("UIAB Conecta NO se llama a sí misma como la cámara", () => {
    const conecta = nodoOrganizacionConecta();
    const nombres = [conecta.name, ...[conecta.alternateName].flat()].join(" | ");
    expect(nombres).not.toMatch(/Unión Industrial/i);
  });

  it("UIAB Conecta cuelga de la cámara por parentOrganization", () => {
    expect(nodoOrganizacionConecta().parentOrganization).toEqual({ "@id": ID_ORG_UIAB });
    expect(nodoOrganizacionUIAB().subOrganization).toEqual({ "@id": ID_ORG_CONECTA });
  });

  it("el @id de la cámara vive en SU dominio, no en el nuestro", () => {
    // Decir "esta es aquella organización", no "esa organización es mía".
    expect(ID_ORG_UIAB).toMatch(/^https:\/\/www\.uiab\.org\//);
  });

  it("los sameAs van en la cámara y son absolutos", () => {
    const sameAs = nodoOrganizacionUIAB().sameAs;
    expect(sameAs.length).toBeGreaterThanOrEqual(3);
    for (const url of sameAs) expect(url).toMatch(/^https:\/\//);
    // Ponerlos en el nodo del directorio reintroduce la confusión de identidad.
    expect(nodoOrganizacionConecta()).not.toHaveProperty("sameAs");
  });

  it("la ficha cita la cámara por @id en vez de crear un nodo nuevo", () => {
    const fuente = leerCodigo("src", "app", "empresas", "[slug]", "page.tsx");
    expect(fuente).toContain('memberOf: { "@id": ID_ORG_UIAB }');
    // El nodo anónimo viejo declaraba `url: SITE_URL` para la UIAB: 59 fichas
    // afirmando que la cámara vive en uiabconecta.com.
    expect(fuente).not.toMatch(/name:\s*"Unión Industrial de Almirante Brown"/);
  });

  it("la description del layout raíz arranca con la marca", () => {
    const fuente = leer("src", "app", "layout.tsx");
    expect(fuente).toMatch(/description:\s*\n?\s*"UIAB Conecta/);
  });
});

describe("telefonoE164", () => {
  it.each([
    ["+54 11 4239-3636", "+541142393636"],
    ["+541135850855", "+541135850855"],
    ["1165186162", "+541165186162"],
    ["11 2380-7089", "+541123807089"],
    ["+54 3442 41-9341", "+543442419341"],
  ])("normaliza %s", (entrada, esperado) => {
    expect(telefonoE164(entrada)).toBe(esperado);
  });

  it("ante un número ambiguo devuelve el original en vez de inventar característica", () => {
    // 8 dígitos sin característica: no hay forma de saber si es de Burzaco o de
    // otro lado. Un telephone equivocado es peor que uno mal formateado, porque
    // es justo la señal con la que Google decide si la página describe a la
    // empresa o está hablando de otra.
    expect(telefonoE164("40023000")).toBe("40023000");
  });

  it("no inventa nada cuando no hay dato", () => {
    expect(telefonoE164(null)).toBeNull();
    expect(telefonoE164("   ")).toBeNull();
    expect(telefonoE164("123")).toBeNull();
  });
});

describe("breadcrumbs", () => {
  const ld = jsonLdBreadcrumbs([
    { nombre: "Inicio", href: "/" },
    { nombre: "Directorio", href: "/directorio" },
    { nombre: "Vaxler" },
  ]) as any;

  it("las posiciones arrancan en 1 y son correlativas", () => {
    expect(ld.itemListElement.map((i: any) => i.position)).toEqual([1, 2, 3]);
  });

  it("los item son URLs absolutas", () => {
    for (const el of ld.itemListElement) {
      if (el.item) expect(el.item).toMatch(/^https:\/\/www\.uiabconecta\.com/);
    }
  });

  it("la última miga (la página actual) puede ir sin item", () => {
    expect(ld.itemListElement.at(-1)).not.toHaveProperty("item");
  });
});

describe("landings de rubro", () => {
  it("no hay slugs repetidos", () => {
    const slugs = RUBROS_SEO.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(RUBROS_SEO)("$slug tiene copy propio y usable", (rubro) => {
    // La intro es lo único que diferencia la landing de /directorio filtrado.
    const palabras = rubro.intro.trim().split(/\s+/).length;
    expect(palabras).toBeGreaterThanOrEqual(120);
    expect(palabras).toBeLessThanOrEqual(200);
    expect(rubro.intro).not.toContain("#"); // texto plano, sin markdown

    // El template del layout raíz agrega " | UIAB Conecta" (15 chars).
    expect(rubro.title.length).toBeLessThanOrEqual(60);
    expect(rubro.title).not.toMatch(/UIAB Conecta/);

    expect(rubro.description.length).toBeGreaterThanOrEqual(80);
    expect(rubro.description.length).toBeLessThanOrEqual(180);

    // El H1 es la keyword, no la marca.
    expect(rubro.h1).not.toMatch(/UIAB Conecta/);
    expect(rubro.catSlugs.length + rubro.tagNombres.length).toBeGreaterThan(0);
  });

  it("una categoría no puede apuntar a dos landings distintas", () => {
    const vistos = new Map<string, string>();
    for (const r of RUBROS_SEO) {
      for (const c of r.catSlugs) {
        const previo = vistos.get(c);
        expect(previo, `la categoría "${c}" está en ${previo} y en ${r.slug}`).toBeUndefined();
        vistos.set(c, r.slug);
      }
    }
  });

  it("el mapa inverso resuelve los slugs fragmentados del catálogo", () => {
    // 'Informática', 'Informática, Sistemas y Soporte IT', 'Desarrollo de
    // Software Industrial' y 'Telecomunicaciones y Redes' son cuatro filas
    // distintas de `categorias` para el mismo rubro: los cuatro chips de una
    // ficha tienen que llevar a la MISMA landing.
    for (const c of [
      "informatica",
      "informatica-sistemas",
      "desarrollo-software-industria",
      "telecomunicaciones-redes",
    ]) {
      expect(landingDeCategoria(c)?.slug).toBe("informatica-industrial");
    }
  });

  it("la pertenencia une las dos taxonomías", () => {
    const quimica = getRubroSeo("quimica")!;
    // por categoría
    expect(perteneceAlRubro(quimica, { categoriaSlugs: ["quimica"] })).toBe(true);
    // por etiqueta, aunque la categoría sea otra (BECKERS es 'Pinturerías')
    expect(
      perteneceAlRubro(quimica, { categoriaSlugs: ["pinturerias"], tags: ["Química"] })
    ).toBe(true);
    expect(perteneceAlRubro(quimica, { categoriaSlugs: ["textil"], tags: ["Tela"] })).toBe(false);
  });

  it("el umbral está documentado y es mayor a 1", () => {
    // Una landing con una sola socia tiene menos texto propio que su propio
    // encabezado y pie, y encima le compite a la ficha de esa misma socia.
    // El conteo real contra producción lo chequea herramientas/verificar-rubros.ts.
    expect(UMBRAL_SOCIAS).toBeGreaterThanOrEqual(3);
  });

  it("las 13 landings están en el sitemap", () => {
    const fuente = leer("src", "app", "sitemap.ts");
    expect(fuente).toContain("RUBROS_SEO.map");
    expect(fuente).toContain("/rubros/${r.slug}");
  });

  it("las landings NO cuelgan de /empresas", () => {
    // src/app/empresas/layout.tsx impone `canonical: "/empresas"` a todos sus
    // hijos: es el mismo mecanismo que el 09/08/2026 dejó el sitio con 10 URLs
    // indexadas de 64.
    expect(() => leer("src", "app", "empresas", "rubro")).toThrow();
    expect(() => leer("src", "app", "rubros", "[slug]", "page.tsx")).not.toThrow();
  });
});

describe("enlazado interno", () => {
  it("el marquee de la home recibe los logos por props, no los busca en el cliente", () => {
    // Con el fetch en useEffect, los ~50 <Link> a fichas sólo existían después
    // de hidratar: la home le servía a Googlebot CERO enlaces a fichas.
    const banner = leerCodigo("src", "components", "ui", "directorio", "banner-logos-socias.tsx");
    expect(banner).not.toContain("useEffect");
    expect(banner).not.toContain("createClient");
    expect(banner).toMatch(/empresas: SociaConLogo\[\]/);
  });

  it("el orden del marquee no usa Math.random (rompería la hidratación)", () => {
    const banner = leerCodigo("src", "components", "ui", "directorio", "banner-logos-socias.tsx");
    expect(banner).not.toContain("Math.random");
  });

  it("/empresas es un Server Component que rinde el índice A-Z", () => {
    const pagina = leerCodigo("src", "app", "empresas", "page.tsx");
    expect(pagina).not.toMatch(/^"use client"/);
    expect(pagina).toContain("IndiceEmpresas");
  });
});
