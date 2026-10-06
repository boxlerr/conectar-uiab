import { describe, it, expect } from "vitest";
import { plantillaBoletinNuevo, type DatosBoletinNuevo } from "@/lib/email/plantillas-boletin";

/**
 * El correo del aviso del Boletín.
 *
 * Dos clases de cosas se fijan acá. Las de CORRECCIÓN —que el enlace apunte a
 * la nota y no al archivo de la foto, que un `&` en el título no rompa la
 * maqueta— y las de COMPATIBILIDAD con Outlook, que usa el motor de Word y
 * descarta en silencio lo que no entiende. Las reglas de Outlook están en
 * `docs/EMAIL_SETUP.md` §7.1, y ya rompieron un correo en producción: un
 * gradiente con texto blanco encima le llegó a un socio como un rectángulo
 * vacío donde iba el botón.
 */

const URL_NOTA = "https://www.uiabconecta.com/boletin/paro-de-actividades-fab6bc0e";
const URL_FOTO = "https://hyuqtlgnoekwdkfwghzp.supabase.co/storage/v1/object/public/imagenes-publicas/boletin/1.jpg";

const base = (extra: Partial<DatosBoletinNuevo> = {}): DatosBoletinNuevo => ({
  titulo: "Paro de actividades",
  bajada: "El jueves no hay atención en la sede.",
  extracto: "La sede permanece cerrada por asamblea.",
  hayMas: false,
  url: URL_NOTA,
  imagenUrl: null,
  fecha: "22 de septiembre de 2026",
  ...extra,
});

describe("asunto del aviso", () => {
  it("es el título de la nota, con la marca del boletín", () => {
    expect(plantillaBoletinNuevo(base()).asunto).toBe("Paro de actividades — Boletín UIAB");
  });

  it("sin título usa la bajada, y no un genérico repetido", () => {
    // Un asunto igual en todos los avisos hace que el segundo no se abra.
    const { asunto } = plantillaBoletinNuevo(base({ titulo: "", bajada: "Cambia el horario" }));
    expect(asunto).toBe("Cambia el horario — Boletín UIAB");
  });

  it("sin título ni bajada usa la primera línea del texto", () => {
    const { asunto } = plantillaBoletinNuevo(
      base({ titulo: "", bajada: "", extracto: "Abrió la inscripción\nSegundo renglón" })
    );
    expect(asunto).toBe("Abrió la inscripción — Boletín UIAB");
  });

  it("recorta un título largo en palabra entera", () => {
    const { asunto } = plantillaBoletinNuevo(base({ titulo: "palabra ".repeat(40).trim() }));
    expect(asunto.endsWith("… — Boletín UIAB")).toBe(true);
    expect(asunto).not.toContain("palabr…");
  });
});

describe("el cuerpo del correo", () => {
  it("el botón lleva a la nota", () => {
    const { html } = plantillaBoletinNuevo(base());
    expect(html).toContain(URL_NOTA);
  });

  it("la foto se muestra pero enlaza a la nota, no al archivo", () => {
    // Tocar la foto tiene que abrir la nota: en un correo con imagen grande,
    // mucha gente toca la imagen antes que el botón. Si el href fuera la
    // imagen, se les abriría el .jpg pelado del bucket.
    const { html } = plantillaBoletinNuevo(base({ imagenUrl: URL_FOTO }));
    expect(html).toContain(`src="${URL_FOTO}"`);
    expect(html).toContain(`<a href="${URL_NOTA}"`);
    expect(html).not.toContain(`<a href="${URL_FOTO}"`);
  });

  it("la foto lleva alt, porque Outlook la bloquea por defecto", () => {
    const { html } = plantillaBoletinNuevo(base({ imagenUrl: URL_FOTO }));
    expect(html).toContain('alt="Paro de actividades"');
  });

  it("una publicación que es sólo una foto igual dice algo", () => {
    // Sin esto el correo llega con el encabezado y nada más debajo.
    const { html } = plantillaBoletinNuevo(
      base({ titulo: "", bajada: "", extracto: "", imagenUrl: URL_FOTO })
    );
    expect(html).toContain("La UIAB publicó algo nuevo en el boletín.");
    expect(html).toContain("Nueva publicación en el Boletín");
  });

  it("el botón cambia según si quedó texto sin leer", () => {
    expect(plantillaBoletinNuevo(base({ hayMas: true })).html).toContain("Leer la nota completa");
    expect(plantillaBoletinNuevo(base({ hayMas: false })).html).toContain("Ver la publicación");
  });

  it("los puntos suspensivos sólo aparecen si el texto se cortó", () => {
    expect(plantillaBoletinNuevo(base({ hayMas: true })).html).toContain("por asamblea.…");
    expect(plantillaBoletinNuevo(base({ hayMas: false })).html).not.toContain("por asamblea.…");
  });

  it("dice por qué le llega y cómo darse de baja", () => {
    const { html, texto } = plantillaBoletinNuevo(base());
    expect(html).toContain("figura como socia en el padrón de la UIAB");
    expect(texto).toContain("te damos de baja");
  });
});

describe("escapado", () => {
  it("un título con & o < no rompe la maqueta", () => {
    const { html } = plantillaBoletinNuevo(base({ titulo: "Aceros & Cía <SA>" }));
    expect(html).toContain("Aceros &amp; Cía &lt;SA&gt;");
    expect(html).not.toContain("<SA>");
  });

  it("el texto de la nota se escapa igual que el título", () => {
    const { html } = plantillaBoletinNuevo(
      base({ extracto: '<script>alert(1)</script>', bajada: "" })
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("los saltos de línea del texto se ven como renglones", () => {
    const { html } = plantillaBoletinNuevo(base({ extracto: "Primero\nSegundo" }));
    expect(html).toContain("Primero<br/>Segundo");
  });
});

describe("compatibilidad con Outlook", () => {
  it("no usa gradientes en ningún lado", () => {
    // El motor de Word los ignora y no pinta nada: el texto blanco de encima
    // queda blanco sobre blanco. Es el bug que ya llegó a un socio.
    const { html } = plantillaBoletinNuevo(base({ imagenUrl: URL_FOTO }));
    expect(html).not.toContain("linear-gradient");
  });

  it("el botón trae su bloque VML", () => {
    const { html } = plantillaBoletinNuevo(base());
    expect(html).toContain("v:roundrect");
  });
});

describe("la versión en texto plano", () => {
  it("separa los bloques con un renglón en blanco", () => {
    // Un `.filter` sobre las cadenas vacías se comía justamente estos
    // renglones y dejaba la versión texto como un muro.
    const { texto } = plantillaBoletinNuevo(base());
    expect(texto).toContain("\n\n");
    expect(texto).not.toContain("\n\n\n");
  });

  it("lleva el título, la fecha y el enlace", () => {
    const { texto } = plantillaBoletinNuevo(base());
    expect(texto).toContain("Paro de actividades");
    expect(texto).toContain("22 de septiembre de 2026");
    expect(texto).toContain(URL_NOTA);
  });

  it("no arrastra HTML", () => {
    const { texto } = plantillaBoletinNuevo(base({ imagenUrl: URL_FOTO }));
    expect(texto).not.toContain("<");
  });
});
