import { describe, it, expect } from "vitest";
import {
  bloquesDeCuerpo,
  cuerpoSinMarcas,
  descripcionComunicado,
  esNotaIndexable,
  prefijoIdDeSlug,
  rutaComunicado,
  slugComunicado,
} from "@/modulos/boletin/formato";

/**
 * Las URLs del Boletín.
 *
 * El slug no se guarda en la base: se calcula del título y lleva pegados los
 * 8 primeros caracteres del uuid. Eso hace que la URL sea única sin unique
 * index y —lo que importa acá— que un enlace viejo nunca muera: alcanza el
 * sufijo para volver a encontrar la nota. Estos tests fijan las dos mitades de
 * ese trato (armar la URL y volver a leerla) y el criterio de qué entra al
 * índice de Google.
 */

const ID = "fab6bc0e-dea1-435f-8233-8704ba83fa20";

describe("slug de una nota", () => {
  it("usa el título y termina en los 8 del id", () => {
    const slug = slugComunicado({ id: ID, titulo: "Así se ve una nota del Boletín UIAB", cuerpo: "" });
    expect(slug).toBe("asi-se-ve-una-nota-del-boletin-uiab-fab6bc0e");
  });

  it("sin título cae a la primera línea del texto", () => {
    const slug = slugComunicado({
      id: ID,
      titulo: "",
      cuerpo: "Cambia el horario de atención\n\nDesde el lunes…",
    });
    expect(slug).toBe("cambia-el-horario-de-atencion-fab6bc0e");
  });

  it("una publicación que es sólo una foto igual tiene URL legible", () => {
    expect(slugComunicado({ id: ID, titulo: "", cuerpo: "" })).toBe("publicacion-con-foto-fab6bc0e");
    // Y si no queda NADA legible (emojis, signos), no puede quedar un slug
    // que arranque con el guión del sufijo.
    const soloSignos = slugComunicado({ id: ID, titulo: "¿¡— …!?", cuerpo: "" });
    expect(soloSignos).toBe("novedad-fab6bc0e");
  });

  it("dos notas con el mismo título no colisionan", () => {
    const a = slugComunicado({ id: ID, titulo: "Asamblea anual", cuerpo: "" });
    const b = slugComunicado({ id: "11112222-dea1-435f-8233-8704ba83fa20", titulo: "Asamblea anual", cuerpo: "" });
    expect(a).not.toBe(b);
  });

  it("un título larguísimo no hace una URL interminable", () => {
    const slug = slugComunicado({ id: ID, titulo: "palabra ".repeat(40), cuerpo: "" });
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-fab6bc0e")).toBe(true);
  });

  it("rutaComunicado devuelve la ruta de la app", () => {
    expect(rutaComunicado({ id: ID, titulo: "Asamblea anual", cuerpo: "" })).toBe(
      "/boletin/asamblea-anual-fab6bc0e"
    );
  });
});

describe("volver del slug al id", () => {
  it("lee el sufijo del slug nuevo", () => {
    expect(prefijoIdDeSlug("asamblea-anual-fab6bc0e")).toBe("fab6bc0e");
  });

  it("acepta el uuid pelado de los enlaces viejos", () => {
    expect(prefijoIdDeSlug(ID)).toBe("fab6bc0e");
  });

  it("encuentra la nota aunque el título haya cambiado", () => {
    // Es el motivo de que el sufijo exista: el enlace que alguien mandó por
    // WhatsApp tiene que seguir llegando a la nota después de corregirle el
    // título (la página lo redirige 301 al slug de hoy).
    const antes = slugComunicado({ id: ID, titulo: "Asamblea anual", cuerpo: "" });
    const despues = slugComunicado({ id: ID, titulo: "Asamblea anual ordinaria 2026", cuerpo: "" });
    expect(antes).not.toBe(despues);
    expect(prefijoIdDeSlug(antes)).toBe(prefijoIdDeSlug(despues));
  });

  it("no inventa un id donde no hay", () => {
    expect(prefijoIdDeSlug("hola-mundo")).toBe(null);
    expect(prefijoIdDeSlug("")).toBe(null);
    // 7 caracteres no alcanzan, y "zzzzzzzz" no es hexadecimal.
    expect(prefijoIdDeSlug("nota-fab6bc0")).toBe(null);
    expect(prefijoIdDeSlug("nota-zzzzzzzz")).toBe(null);
  });
});

describe("qué entra al índice de Google", () => {
  const cuerpoDeNota = "palabra ".repeat(60);

  it("una nota con título y cuerpo entra", () => {
    expect(esNotaIndexable({ titulo: "Asamblea anual", cuerpo: cuerpoDeNota })).toBe(true);
  });

  it("un aviso de dos líneas no entra", () => {
    expect(esNotaIndexable({ titulo: "Asamblea anual", cuerpo: "Es el jueves a las 18." })).toBe(false);
  });

  it("una publicación sin título no entra, por más larga que sea", () => {
    expect(esNotaIndexable({ titulo: "   ", cuerpo: cuerpoDeNota })).toBe(false);
  });
});

describe("descripción para el <meta>", () => {
  it("recorta sin partir una palabra al medio", () => {
    const d = descripcionComunicado({ cuerpo: "palabra ".repeat(60) }, 50);
    expect(d.length).toBeLessThanOrEqual(51); // 50 + el "…"
    expect(d.endsWith("…")).toBe(true);
    expect(d).not.toMatch(/pala…$/);
  });

  it("deja el texto entero si ya entra", () => {
    expect(descripcionComunicado({ cuerpo: "Cambia el horario." })).toBe("Cambia el horario.");
  });

  it("aplana los saltos de línea", () => {
    expect(descripcionComunicado({ cuerpo: "Una línea.\n\nOtra línea." })).toBe("Una línea. Otra línea.");
  });
});

describe("el cuerpo de la nota", () => {
  it("separa párrafos por línea en blanco", () => {
    expect(bloquesDeCuerpo("Uno.\n\nDos.")).toEqual([
      { tipo: "parrafo", texto: "Uno." },
      { tipo: "parrafo", texto: "Dos." },
    ]);
  });

  it("una línea que arranca con ## es un subtítulo", () => {
    expect(bloquesDeCuerpo("Intro.\n\n## La visita\n\nVinieron todos.")).toEqual([
      { tipo: "parrafo", texto: "Intro." },
      { tipo: "subtitulo", texto: "La visita" },
      { tipo: "parrafo", texto: "Vinieron todos." },
    ]);
  });

  it("el subtítulo corta el párrafo aunque esté pegado al texto de arriba", () => {
    // Pasa si alguien aprieta el botón de subtítulo sin dejar línea en blanco.
    expect(bloquesDeCuerpo("Intro.\n## La visita\nVinieron todos.")).toEqual([
      { tipo: "parrafo", texto: "Intro." },
      { tipo: "subtitulo", texto: "La visita" },
      { tipo: "parrafo", texto: "Vinieron todos." },
    ]);
  });

  it("un salto simple NO parte el párrafo", () => {
    // Una dirección o una lista corta se escriben con enter simple y tienen
    // que seguir siendo un solo bloque (el <p> las respeta con pre-line).
    expect(bloquesDeCuerpo("Drago 1951\nBurzaco")).toEqual([
      { tipo: "parrafo", texto: "Drago 1951\nBurzaco" },
    ]);
  });

  it("un ## sin texto no deja un subtítulo vacío", () => {
    // Es el estado en el que queda el textarea justo después de apretar el
    // botón "Subtítulo": la vista previa no puede mostrar un hueco.
    expect(bloquesDeCuerpo("Intro.\n\n## ")).toEqual([{ tipo: "parrafo", texto: "Intro." }]);
  });

  it("cuerpoSinMarcas saca los ## para los resúmenes", () => {
    expect(cuerpoSinMarcas("## La visita\n\nVinieron todos.")).toBe("La visita\n\nVinieron todos.");
  });
});

describe("descripción con bajada", () => {
  it("prefiere la bajada, que para eso está", () => {
    expect(
      descripcionComunicado({ bajada: "La cámara firmó un convenio.", cuerpo: "Otro texto largo." })
    ).toBe("La cámara firmó un convenio.");
  });

  it("sin bajada cae al cuerpo, sin las marcas", () => {
    expect(descripcionComunicado({ bajada: "  ", cuerpo: "## Sección\n\nTexto." })).toBe(
      "Sección Texto."
    );
  });
});
