import { describe, expect, it } from "vitest";
import {
  entidadCoincideConBusqueda,
  type CamposBuscablesDeEntidad,
} from "@/lib/datos/busqueda-directorio";

/**
 * La búsqueda del directorio sólo pasaba a minúsculas: "metalurgica" no
 * encontraba "Metalúrgica". Ahora ignora tildes del término y de los campos.
 */
const SOCIA: CamposBuscablesDeEntidad = {
  nombre: "Fundición Burzaco S.A.",
  categoria: "Metalúrgica",
  descripcionCorta: "Piezas de hierro gris para la industria automotriz.",
  ubicacion: "Burzaco, Almirante Brown",
  servicios: ["Tornería y Mecanizado CNC"],
  // Escrita por la socia, sin tilde: el caso inverso.
  tags: ["Fundicion a presion", "Soldadura electrica"],
  certificaciones: [{ codigo: "iso-9001", etiqueta: "ISO 9001", familia: "calidad", verificada: true }],
};

const busca = (q: string) => entidadCoincideConBusqueda(SOCIA, q);

describe("entidadCoincideConBusqueda", () => {
  it("encuentra 'Metalúrgica' escribiendo 'metalurgica', sin tilde", () => {
    expect(busca("metalurgica")).toBe(true);
  });

  it("ignora tildes y mayúsculas en los dos sentidos", () => {
    expect(busca("TORNERIA")).toBe(true);
    expect(busca("fundicion burzaco")).toBe(true);
    // Tilde en el término y no en el campo.
    expect(busca("soldadura eléctrica")).toBe(true);
    expect(busca("fundición a presión")).toBe(true);
  });

  it("busca en todos los campos: servicios, etiquetas, ubicación y certificaciones", () => {
    expect(busca("mecanizado cnc")).toBe(true);
    expect(busca("electrica")).toBe(true);
    expect(busca("almirante")).toBe(true);
    expect(busca("iso 9001")).toBe(true);
    expect(busca("hierro gris")).toBe(true);
  });

  it("la frase va entera dentro de un mismo campo, como antes", () => {
    // "burzaco" está en el nombre y "cnc" en un servicio: no es una frase de ningún campo.
    expect(busca("burzaco cnc")).toBe(false);
    expect(busca("plástico")).toBe(false);
  });

  it("sin término (o sólo espacios) muestra todo", () => {
    expect(busca("")).toBe(true);
    expect(busca("   ")).toBe(true);
  });

  it("tolera una entidad sin certificaciones", () => {
    const sinCertificaciones = { ...SOCIA, certificaciones: undefined };
    expect(entidadCoincideConBusqueda(sinCertificaciones, "iso")).toBe(false);
    expect(entidadCoincideConBusqueda(sinCertificaciones, "metalurgica")).toBe(true);
  });
});
