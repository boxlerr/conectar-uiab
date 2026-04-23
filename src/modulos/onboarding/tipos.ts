import type { Step } from "react-joyride";

/**
 * Identificadores de cada tour guiado. Se persisten en
 * `perfiles.tutoriales_vistos` como claves del objeto JSON.
 */
export type TourId =
  | "pago_pendiente"
  | "perfil"
  | "directorio"
  | "oportunidades"
  | "dashboard";

/** Definición de un tour: sus pasos y metadatos. */
export interface DefinicionTour {
  id: TourId;
  titulo: string;
  descripcion: string;
  pasos: Step[];
}
