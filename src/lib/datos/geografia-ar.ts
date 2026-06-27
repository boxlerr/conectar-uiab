// Listas cerradas para evitar escritura libre en localidad/provincia
// (datos consistentes → filtros y reportes confiables).

export const PROVINCIAS_AR = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

// Localidades del Partido de Almirante Brown (alcance del directorio).
export const LOCALIDADES_ALMIRANTE_BROWN = [
  "Adrogué",
  "Burzaco",
  "Claypole",
  "Don Orione",
  "Glew",
  "José Mármol",
  "Longchamps",
  "Malvinas Argentinas",
  "Ministro Rivadavia",
  "Rafael Calzada",
  "San Francisco de Asís",
  "San José",
] as const;

export type ProvinciaAr = (typeof PROVINCIAS_AR)[number];
export type LocalidadAB = (typeof LOCALIDADES_ALMIRANTE_BROWN)[number];
