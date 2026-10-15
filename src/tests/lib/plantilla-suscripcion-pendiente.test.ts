import { describe, it, expect } from "vitest";
import { plantillaSuscripcionPendiente } from "@/lib/email/plantillas-suscripciones";

/**
 * El mail "Completá tu suscripción", que sale apenas termina el registro.
 *
 * Prometía dos cosas que el código no hace: que la UIAB te llamaba para
 * coordinar el cobro (el cobro es autoservicio en Sipago) y que con el pago
 * registrado el perfil quedaba publicado (la ficha espera la aprobación de un
 * admin, que no puede aprobarla sin la suscripción activa). Estos tests fijan
 * que diga lo mismo que el registro, /confirmar-email y el video del alta.
 */

const URL_CHECKOUT = "https://www.uiabconecta.com/suscripcion/checkout";

const FRASE_CANONICA =
  "Después de pagar, la UIAB confirma el pago y aprueba tu ficha. Cuando quede publicada en el directorio, te avisamos por mail.";

const plantilla = (nombre = "Tornería Burzaco S.A.") =>
  plantillaSuscripcionPendiente({
    nombre,
    email: "compras@ejemplo.com",
    plan: "UIAB Conecta — Mensual",
    monto: 50000,
    entidad: "empresa",
    urlCheckout: URL_CHECKOUT,
  });

/** El HTML sin etiquetas ni espacios de más, para buscar frases enteras. */
const textoVisible = (html: string) =>
  html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

describe("lo que promete", () => {
  it("no dice que pagar publica la ficha", () => {
    const { html, texto } = plantilla();
    expect(html).not.toMatch(/queda publicad/i);
    expect(texto).not.toMatch(/queda publicad/i);
  });

  it("no promete que alguien la contacte para cobrar", () => {
    // Con Sipago el cobro es autoservicio. El contacto sólo existe cuando no
    // hay pasarela, y ahí el que lo avisa es el checkout, no este mail.
    const { html, texto } = plantilla();
    for (const s of [html, texto]) {
      expect(s).not.toMatch(/contactamos|te van a contactar|coordinar el cobro/i);
    }
  });

  it("no dice que falta un solo paso: son dos, pagar y la aprobación", () => {
    const { html, texto } = plantilla();
    for (const s of [html, texto]) {
      expect(s).not.toMatch(/(un|único|último|solo|sólo) paso/i);
      expect(s).toContain("faltan dos pasos");
    }
  });

  it("explica lo que pasa después de pagar con la frase del registro", () => {
    const { html, texto } = plantilla();
    expect(textoVisible(html)).toContain(FRASE_CANONICA);
    expect(texto).toContain(FRASE_CANONICA);
  });

  it("avisa que sin confirmar el correo no se puede entrar a pagar", () => {
    // El checkout pide sesión y "Confirm email" está prendido: el que toca el
    // botón antes de confirmar termina rebotado en el login.
    const { html, texto } = plantilla();
    expect(textoVisible(html)).toContain("¿Todavía no confirmaste tu correo?");
    expect(texto).toContain("¿Todavía no confirmaste tu correo?");
  });
});

describe("el botón", () => {
  it("lleva al checkout y dice lo mismo que /confirmar-email", () => {
    const { html } = plantilla();
    expect(html).toContain(`href="${URL_CHECKOUT}"`);
    expect(html).toContain("Pagar la membresía");
  });

  it("trae su bloque VML para Outlook y ningún gradiente", () => {
    const { html } = plantilla();
    expect(html).toContain("v:roundrect");
    expect(html).not.toContain("linear-gradient");
  });
});

describe("escapado", () => {
  it("el nombre del formulario de registro no rompe la maqueta", () => {
    const { html } = plantilla("Pérez & Hijos <SA>");
    expect(html).toContain("Pérez &amp; Hijos &lt;SA&gt;");
    expect(html).not.toContain("<SA>");
  });
});

describe("la versión en texto plano", () => {
  it("lleva el enlace al checkout, el plan y el monto", () => {
    const { texto } = plantilla();
    expect(texto).toContain(URL_CHECKOUT);
    expect(texto).toContain("Plan: UIAB Conecta — Mensual");
    expect(texto).toMatch(/Monto mensual: \$\s?50\.000/);
  });

  it("separa los bloques con un renglón en blanco y no arrastra HTML", () => {
    const { texto } = plantilla();
    expect(texto).toContain("\n\n");
    expect(texto).not.toContain("\n\n\n");
    expect(texto).not.toContain("<");
  });
});
