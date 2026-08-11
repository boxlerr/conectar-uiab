/**
 * Landings de rubro con URL propia y contenido server-rendered.
 *
 * POR QUÉ EXISTEN
 *
 * Hasta ahora el sitio tenía exactamente tres tipos de página indexable con
 * contenido real: la home, /directorio y las 59 fichas. Ninguna capa intermedia.
 * Toda la demanda de búsqueda B2B local —"empresas químicas en Burzaco",
 * "metalúrgicas de Almirante Brown", "proveedores de packaging zona sur"— no
 * tenía dónde aterrizar: el rubro sólo existía como estado de React en el
 * filtro de /empresas, ni siquiera viajaba en la URL.
 *
 * Es el mismo patrón que ya funcionó en el proyecto UniversoTattoo
 * (lib/db/categorias-seo.ts): las categorías vivían como `?categoria=N`, todas
 * servían el mismo HTML y todas canonicalizaban al listado, así que ninguna
 * competía por su keyword. Al darles URL propia con copy server-rendered
 * empezaron a rankear.
 *
 * POR QUÉ HARDCODEADO Y NO GENERADO DESDE `categorias`
 *
 * Si las landings se generaran solas desde la tabla, cualquier categoría que
 * cree una socia se convertiría automáticamente en una URL indexable con una
 * sola empresa adentro. El array acá es una decisión editorial explícita, y
 * `src/tests/seo/rubros.test.ts` falla si algún rubro baja de UMBRAL_SOCIAS.
 *
 * EL UMBRAL ES 3 Y NO 1
 *
 * Una landing con una sola socia tiene menos contenido propio que su propio
 * encabezado y pie (~170 palabras), y además compite con la ficha de esa misma
 * socia por la misma consulta — que es justo la página que queremos que rankee.
 * Rubros que hoy no llegan y entran solos cuando crucen el umbral:
 * transporte y logística (2), textil (2), biotecnología (1).
 *
 * LAS DOS TAXONOMÍAS
 *
 * El proyecto tiene dos catálogos superpuestos: `categorias` (una o varias por
 * socia, vía `empresas_categorias`) y `tags` (etiquetas de capacidad, vía
 * `empresas_tags`). Ninguno de los dos alcanza solo: 'Informática' tiene 2
 * socias, 'Informática, Sistemas y Soporte IT' 1, 'Desarrollo de Software
 * Industrial' 1 y 'Telecomunicaciones y Redes' 1 — cuatro filas distintas para
 * cinco empresas del mismo rubro. Por eso cada landing declara TODOS los slugs
 * y etiquetas equivalentes y la pertenencia se resuelve por unión.
 *
 * La fusión es de PRESENTACIÓN, no de base: migrar `categorias` implicaría
 * tocar `empresas_categorias` y arriesgar las 59 fichas por una mejora que se
 * puede conseguir acá, sin riesgo.
 */

/** Mínimo de socias aprobadas para que un rubro merezca URL propia. */
export const UMBRAL_SOCIAS = 3;

export interface RubroSeo {
  slug: string;
  /** Nombre corto, para chips, breadcrumbs y el índice. */
  nombre: string;
  /** H1 de la landing: la keyword, no la marca. */
  h1: string;
  /** `<title>`. El template raíz agrega " | UIAB Conecta": no lo repitas acá. */
  title: string;
  description: string;
  /** 120-180 palabras, server-rendered ARRIBA de la grilla. */
  intro: string;
  /** Slugs de `categorias` que caen en este rubro. */
  catSlugs: string[];
  /** Nombres de `tags` que caen en este rubro (match exacto, sin distinguir mayúsculas). */
  tagNombres: string[];
}

export const RUBROS_SEO: RubroSeo[] = [
  {
    slug: "quimica",
    nombre: "Química",
    h1: "Empresas químicas en Almirante Brown",
    title: "Empresas Químicas en Almirante Brown y Burzaco",
    description:
      "Industrias y proveedores químicos socios de la UIAB en Burzaco y Almirante Brown: insumos, materias primas, resinas y especialidades. Perfiles verificados con contacto directo.",
    intro:
      "Las empresas químicas de Almirante Brown que integran la red UIAB cubren desde la materia prima hasta el producto ya formulado. Doce están radicadas en Burzaco y una en Longchamps.\n\nEn el listado hay fabricación y distribución de productos químicos, resinas, abrasivos, siliconas y selladores, tintas y diluyentes, pinturas industriales y pintura en polvo. FINE & PURE trabaja productos químicos para la industria alimenticia; PLAQUIMET, química y resinas; KORUND fabrica abrasivos y BESTCHEM, siliconas y selladores. LATIN CHEMICAL SUPPLIERS se dedica a la distribución, que es lo que te sirve cuando lo que necesitás es abastecimiento y no fabricación. Varias figuran además con la etiqueta de provisión de materiales, la que marca a quien tiene stock para vender.\n\nEn cada ficha vas a encontrar la actividad tal como la declara la empresa, los rubros y etiquetas con los que trabaja, y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["quimica"],
    tagNombres: ["Química"],
  },
  {
    slug: "metalurgica-y-metalmecanica",
    nombre: "Metalúrgica y metalmecánica",
    h1: "Empresas metalúrgicas y metalmecánicas en Almirante Brown",
    title: "Metalúrgicas y Metalmecánica en Almirante Brown",
    description:
      "Metalúrgicas, fundiciones y talleres metalmecánicos socios de la UIAB en Burzaco y Longchamps: mecanizado CNC, soldadura, forja, estructuras metálicas y fabricación a medida.",
    intro:
      "Las empresas metalúrgicas y metalmecánicas de Almirante Brown que integran la red UIAB cubren la cadena completa: desde transformar el metal en bruto hasta entregar el equipo terminado.\n\nEn el listado hay fundición de hierro gris, forja y templado, mecanizado CNC, soldadura, corte y plegado, estampado metálico, estructuras metálicas y fabricación a medida. También producto terminado: maquinaria hidráulica, maquinaria para minería y construcción, componentes mecánicos para equipos de elevación y traslación de materiales, tableros eléctricos y abrasivos. ACEROS ANGELETTI funde hierro gris y FORJA ATLAS trabaja forja y fundición, las dos en Burzaco. Desde Longchamps, METALURGICA LONGCHAMPS hace mantenimiento industrial con mecanizado, soldadura, corte y plegado, y MIGUEL ABAD diseña y fabrica componentes para equipos de elevación. INDUSTRIAS GUIDI produce autopartes con estampado metálico.\n\nCada ficha tiene la actividad declarada por la empresa, sus rubros y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["metalurgica", "maquinarias"],
    tagNombres: [
      "Metalúrgica",
      "Metalmecánica",
      "Fundición",
      "Estructuras metálicas",
      "Mecanizado CNC",
      "Forja",
      "Fabricación de maquinaria",
    ],
  },
  {
    slug: "construccion",
    nombre: "Construcción",
    h1: "Empresas de construcción y materiales en Almirante Brown",
    title: "Construcción y Materiales en Almirante Brown",
    description:
      "Fabricantes y proveedores para la construcción socios de la UIAB en Almirante Brown: perfiles, cerámicos, membranas, estructuras metálicas y alquiler de maquinaria.",
    intro:
      "Las empresas de construcción y materiales de Almirante Brown que integran la red UIAB fabrican insumos para obra, los comercializan o proveen equipamiento.\n\nLo que cubren es concreto: perfiles para construcción en seco, cerámicos, membranas asfálticas, estructuras metálicas, siliconas y selladores, materiales eléctricos, ferretería industrial y construcción modular. También pinturas y artículos conexos por mayor y menor, y alquiler y venta de máquinas para obra, que sirve cuando necesitás resolver una etapa puntual sin comprar el equipo. A. D. BARBIERI fabrica perfiles para construcción en seco; SAINT GOBAIN - MEGAFLEX, membranas asfálticas; ANDARIEGA trabaja construcción modular y TDMA, estructuras metálicas. IND. CERAMICAS LOURDES fabrica cerámicos desde Longchamps; el resto está radicado en Burzaco.\n\nEn cada ficha vas a ver la actividad declarada, los rubros en los que trabaja la empresa y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["construccion", "pinturas-construccion"],
    tagNombres: ["Construcción"],
  },
  {
    slug: "packaging-y-embalaje",
    nombre: "Packaging y embalaje",
    h1: "Empresas de packaging y embalaje en Almirante Brown",
    title: "Packaging y Embalaje Industrial en Almirante Brown",
    description:
      "Proveedores de packaging y embalaje industrial socios de la UIAB en Burzaco: envases plásticos, cartón corrugado, etiquetas, bolsas y embalaje de madera.",
    intro:
      "Las empresas de packaging y embalaje de Almirante Brown que integran la red UIAB cubren etapas distintas del mismo proceso: el envase que contiene el producto, la etiqueta que lo identifica y el embalaje con el que sale de la planta.\n\nEn el listado hay fabricación de envases plásticos, envases de cartón, bolsas de papel, etiquetas autoadhesivas y embalajes de madera, más soluciones de codificación, marcación y trazabilidad industrial. Los perfiles son bien distintos entre sí: POLIGSA fabrica envases plásticos desde Longchamps, y en Burzaco TGI PACK produce envases de cartón, BOLSAPEL bolsas de papel, LABELTEC etiquetas autoadhesivas y GINZUK embalajes de madera. Varias suman etiquetas de gráfica e impresión, troquelado y serigrafía.\n\nCada ficha del directorio tiene la actividad declarada por la empresa, los rubros y etiquetas con los que se presenta, y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["embalajes"],
    tagNombres: ["Packaging", "Embalaje industrial", "Cartón"],
  },
  {
    slug: "plasticos",
    nombre: "Plásticos",
    h1: "Empresas de plásticos en Almirante Brown",
    title: "Empresas de Plásticos en Almirante Brown y Burzaco",
    description:
      "Industrias del plástico socias de la UIAB en Almirante Brown: inyección, extrusión, polietileno, PVC, poliéster y recubrimientos. Perfiles verificados con contacto directo.",
    intro:
      "Las empresas de plásticos de Almirante Brown que integran la red UIAB son siete y cubren eslabones distintos de la misma cadena: la química de base, la transformación de la pieza y la terminación.\n\nEn el listado hay fabricación de envases plásticos por inyección, polietileno, extrusión y PVC; perfiles para construcción en seco; resinas —incluida resina epoxi— como insumo de producción; y pintura por cataforesis para el recubrimiento de piezas, con aplicación en el rubro automotriz. POLIGSA fabrica envases plásticos desde Longchamps; en Burzaco, A. D. BARBIERI trabaja perfiles, extrusión y PVC, PLAQUIMET está del lado de las resinas, BAYRESPLASTIC produce envases y RPA CATAFORESIS FACTORY hace el recubrimiento.\n\nPara afinar la búsqueda entrá a cada ficha: ahí figura la actividad tal como la declara la propia empresa, los rubros y etiquetas con los que trabaja y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["plasticos", "poliester"],
    tagNombres: ["Plásticos", "Poliéster", "Inyección de plásticos", "Extrusión", "Polietileno"],
  },
  {
    slug: "grafica-e-impresion",
    nombre: "Gráfica e impresión",
    h1: "Imprentas y empresas gráficas en Almirante Brown",
    title: "Gráfica e Impresión Industrial en Almirante Brown",
    description:
      "Imprentas y empresas gráficas socias de la UIAB en Burzaco: etiquetas autoadhesivas, packaging impreso, serigrafía, troquelado y rollos de papel.",
    intro:
      "Las imprentas y empresas gráficas de Almirante Brown que integran la red UIAB están orientadas al envase, la etiqueta y los insumos del rubro más que a la gráfica comercial.\n\nEn el listado hay etiquetas autoadhesivas y serigrafía, envases de cartón con troquelado y bolsas de papel. ROLL PAPER aporta la línea de papel: rollos fiscales térmicos y químicos, impresos o lisos, rollos de plotter de 90 gramos, rollos de 50 gramos para la industria textil y de sublimación, etiquetas autoadhesivas para el sector logístico y balanzas, y comercialización de resmas. LABELTEC produce etiquetas autoadhesivas y TGI PACK envases de cartón. Del lado de los insumos, PROLAS fabrica tintas y diluyentes. Las seis están radicadas en Burzaco.\n\nCada ficha muestra la actividad tal como la declara la empresa, los rubros en los que trabaja y el contacto directo. Son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["grafica", "papelera"],
    tagNombres: ["Gráfica e impresión", "Serigrafía", "Papel", "Papel y celulosa"],
  },
  {
    slug: "automatizacion-y-electricidad",
    nombre: "Automatización y electricidad",
    h1: "Automatización industrial y tableros eléctricos en Almirante Brown",
    title: "Automatización Industrial y Tableros Eléctricos en Almirante Brown",
    description:
      "Empresas de automatización industrial, tableros eléctricos e instalaciones socias de la UIAB en Almirante Brown: PLC, SCADA, cableado industrial y material eléctrico.",
    intro:
      "Las socias de la UIAB que trabajan en automatización industrial y tableros eléctricos cubren desde el control de la máquina hasta el gabinete y el material eléctrico que va adentro.\n\nEntre las capacidades declaradas hay programación de PLC, sistemas SCADA, instrumentación, redes industriales, cableado y montaje industrial, puesta en marcha, retrofit, termografía y mantenimiento preventivo y predictivo; también fabricación de tableros eléctricos y de materiales eléctricos, monitoreo y alarmas, codificación y marcación para trazabilidad, y energía solar. Simonetta Automatización encara proyectos de automatismos industriales y control de procesos de baja, media y alta complejidad, incluso llave en mano; ZOLODA fabrica tableros eléctricos y GENROD materiales eléctricos; SISTEMAS DE CODIFICACION trabaja marcación y trazabilidad. Esas cuatro están radicadas en Burzaco.\n\nEntrá a cada ficha: ahí están la actividad declarada, los rubros y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: [
      "electricidad",
      "automatizacion-robotica",
      "paneles-tableros-electricos",
      "instalaciones-electricas",
      "mantenimiento-electronico",
      "energias-renovables",
    ],
    tagNombres: [
      "Electricidad y tableros",
      "Tableros eléctricos",
      "Automatización industrial",
      "Electricidad industrial",
      "Electrónica",
    ],
  },
  {
    slug: "pinturas-y-recubrimientos",
    nombre: "Pinturas y recubrimientos",
    h1: "Pinturas industriales y recubrimientos en Almirante Brown",
    title: "Pinturas Industriales y Recubrimientos en Almirante Brown",
    description:
      "Fabricantes y distribuidores de pinturas, tintas y recubrimientos socios de la UIAB en Burzaco: pintura en polvo, pintura industrial, cataforesis y pinturerías.",
    intro:
      "Las socias de la UIAB que fabrican y aplican pinturas industriales y recubrimientos en Almirante Brown son cuatro y están todas radicadas en Burzaco. Cubren dos tramos distintos de la misma cadena: el producto por un lado, el servicio de aplicación por el otro.\n\nDel lado del producto, BECKERS ARGENTINA fabrica pinturas industriales, PULVERLUX pintura en polvo y PROLAS tintas y diluyentes; las tres figuran además dentro del rubro químico, que es de donde salen las materias primas de una pintura. Del lado del servicio, RPA CATAFORESIS FACTORY aplica pintura por cataforesis, un recubrimiento por inmersión que se usa sobre todo en piezas para la industria automotriz.\n\nSi lo que buscás es un proveedor de pintura para tu línea de producción o un tercero que te haga la terminación, entrá a cada ficha: tenés la actividad declarada por la empresa, sus rubros y el contacto directo. Son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["pinturerias"],
    tagNombres: ["Pinturas y tintas", "Pintura industrial", "Pintura en polvo"],
  },
  {
    slug: "autopartes-y-automotriz",
    nombre: "Autopartes y automotriz",
    h1: "Autopartistas y proveedores de la industria automotriz en Almirante Brown",
    title: "Autopartes e Industria Automotriz en Almirante Brown",
    description:
      "Autopartistas y proveedores de la industria automotriz socios de la UIAB en Burzaco: estampado metálico, caucho, repuestos y tratamientos de superficie.",
    intro:
      "Los autopartistas y proveedores de la industria automotriz que integran la red UIAB están radicados en Burzaco y cubren procesos distintos: la pieza metálica, la pieza de caucho y la terminación superficial.\n\nINDUSTRIAS GUIDI fabrica autopartes con estampado metálico y trabaja también dentro del rubro metalmecánico. JUNAR produce autopartes de caucho y figura además con la etiqueta de repuestos. RPA CATAFORESIS FACTORY aporta el recubrimiento: aplica pintura por cataforesis, un proceso por inmersión habitual en piezas para automotriz. INDUSTRIAS BACO fabrica maquinaria para minería y construcción, y entra en este rubro por su categoría de reparación de automóviles.\n\nSi estás buscando proveedor para una línea de producción o para un lote puntual, entrá a cada ficha: ahí figura la actividad tal como la declara la empresa, los rubros y etiquetas con los que trabaja y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["autopartista", "rep-automoviles"],
    tagNombres: ["Autopartes", "Automotriz"],
  },
  {
    slug: "informatica-industrial",
    nombre: "Informática industrial",
    h1: "Informática, software y telecomunicaciones para la industria en Almirante Brown",
    title: "Informática y Software Industrial en Almirante Brown",
    description:
      "Empresas de software, sistemas de gestión, trazabilidad y telecomunicaciones socias de la UIAB en Almirante Brown. Perfiles verificados con contacto directo.",
    intro:
      "Las socias de la UIAB que trabajan en informática, software y telecomunicaciones para la industria son cuatro y resuelven cosas bastante distintas entre sí.\n\nVaxler es una fábrica de software: desarrolla sistemas de gestión a medida, automatiza procesos con inteligencia artificial e integra sistemas que ya existen —ERP, e-commerce y marketplaces—, además de infraestructura cloud y ciberseguridad. SISTEMAS DE CODIFICACION, en Burzaco, se ocupa de codificación, marcación y trazabilidad industrial: el dato que se imprime sobre el producto y lo sigue por la línea. TODO ADROGUE presta servicios de informática y telecomunicaciones desde Adrogué, con soporte remoto y consultoría técnica. CENTRAL ALERT, en Burzaco, trabaja monitoreo y alarmas, con etiquetas de electrónica, instalación y telecomunicaciones.\n\nEntrá a cada ficha para ver la actividad declarada, los rubros y etiquetas de cada empresa y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: [
      "informatica",
      "informatica-sistemas",
      "desarrollo-software-industria",
      "telecomunicaciones-redes",
    ],
    tagNombres: ["Desarrollo de software", "Telecomunicaciones", "Trazabilidad"],
  },
  {
    slug: "ingenieria-y-consultoria",
    nombre: "Ingeniería y consultoría",
    h1: "Ingeniería y consultoría técnica para la industria en Almirante Brown",
    title: "Ingeniería y Consultoría Técnica en Almirante Brown",
    description:
      "Estudios de ingeniería y consultoría técnica socios de la UIAB en Almirante Brown: proyecto, montaje industrial, puesta en marcha y consultoría de procesos.",
    intro:
      "Las socias de la UIAB que ofrecen ingeniería y consultoría técnica para la industria trabajan en la etapa previa a la compra de equipos: definir el proyecto, dimensionarlo y acompañar la puesta en marcha.\n\nSimonetta Automatización, en Burzaco, encara automatismos industriales y control de procesos de baja, media y alta complejidad, con ingeniería de proyecto, instrumentación, montaje industrial, puesta en marcha y esquemas llave en mano. Vaxler aporta el lado de los sistemas: consultoría y arquitectura de software, integración entre sistemas y transformación digital. TODO ADROGUE suma consultoría técnica en informática y telecomunicaciones desde Adrogué. Branch Ingeniería completa el rubro dentro de la categoría de ingeniería y consultoría técnica.\n\nSi estás armando un pliego o querés una segunda opinión técnica antes de invertir, entrá a cada ficha: tenés la actividad declarada, los rubros y el contacto directo. Todas son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["ingenieria-consultora"],
    tagNombres: ["Consultoría técnica", "Ingeniería de proyecto"],
  },
  {
    slug: "seguridad-e-higiene-industrial",
    nombre: "Seguridad e higiene",
    h1: "Seguridad e higiene industrial en Almirante Brown",
    title: "Seguridad e Higiene Industrial en Almirante Brown",
    description:
      "Empresas de seguridad e higiene industrial socias de la UIAB en Almirante Brown: elementos de protección personal, monitoreo, alarmas y consultoría en seguridad laboral.",
    intro:
      "Las socias de la UIAB que trabajan en seguridad e higiene industrial en Almirante Brown cubren tres frentes distintos: el equipamiento de protección, la vigilancia electrónica y el asesoramiento.\n\nROGUANT, en Burzaco, fabrica guantes y elementos de seguridad, y figura con etiquetas de seguridad e higiene, indumentaria y provisión de materiales: es el proveedor al que le comprás el equipo de protección personal. CENTRAL ALERT, también en Burzaco, trabaja monitoreo y alarmas, con capacidades de electrónica, instalación y telecomunicaciones. Seguridad Líderes está dentro de la categoría de consultoría en seguridad e higiene, que es el lado del asesoramiento.\n\nSi necesitás cubrir el requisito legal, equipar al personal o montar el sistema de monitoreo de la planta, entrá a cada ficha: ahí figura la actividad tal como la declara la empresa, sus rubros y el contacto directo. Son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["seguridad", "seguridad-higiene-consultoria"],
    tagNombres: ["Seguridad e higiene", "Indumentaria"],
  },
  {
    slug: "alimentos-y-bebidas",
    nombre: "Alimentos y bebidas",
    h1: "Industria alimentaria y de bebidas en Almirante Brown",
    title: "Industria Alimentaria y de Bebidas en Almirante Brown",
    description:
      "Empresas de alimentos y bebidas socias de la UIAB en Burzaco y Almirante Brown: producción, insumos de grado alimentario y provisión para la industria.",
    intro:
      "La industria alimentaria y de bebidas dentro de la red UIAB está representada por tres socias, todas radicadas en Burzaco, que cubren el producto terminado y el insumo.\n\nALIMENTOS FRANSRO se dedica a la elaboración de alimentos y figura con la etiqueta de producción en serie. AKUA elabora agua mineral. FINE & PURE aporta el eslabón anterior: fabrica productos químicos para la industria alimenticia, así que entra tanto en este rubro como en el químico, y suma la etiqueta de provisión de materiales.\n\nEs un rubro chico dentro del directorio y va a crecer a medida que se sumen socias, así que si buscás un proveedor alimentario en Almirante Brown conviene mirar también el rubro de packaging, donde están los envases, y el químico, donde están los insumos. En cada ficha vas a encontrar la actividad declarada por la empresa, sus rubros y el contacto directo. Son socias verificadas de la Unión Industrial de Almirante Brown.",
    catSlugs: ["alimentos"],
    tagNombres: ["Alimentaria", "Bebidas"],
  },
];

const PORSLUG = new Map(RUBROS_SEO.map((r) => [r.slug, r]));

export function getRubroSeo(slug: string): RubroSeo | undefined {
  return PORSLUG.get(slug);
}

/** Normaliza para comparar categorías y etiquetas sin sufrir tildes ni mayúsculas. */
function clave(v: string): string {
  return v
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Mapa inverso: de un slug de `categorias` a la landing que le corresponde.
 * Lo usan los chips de rubro de la ficha para enlazar los cuatro slugs
 * fragmentados de informática a la MISMA landing.
 */
export const LANDING_POR_CATEGORIA = new Map<string, RubroSeo>(
  RUBROS_SEO.flatMap((r) => r.catSlugs.map((c) => [clave(c), r] as const))
);

export const LANDING_POR_TAG = new Map<string, RubroSeo>(
  RUBROS_SEO.flatMap((r) => r.tagNombres.map((t) => [clave(t), r] as const))
);

/** La landing de rubro de una categoría, o undefined si esa categoría no tiene. */
export function landingDeCategoria(slugCategoria: string | null | undefined) {
  if (!slugCategoria) return undefined;
  return LANDING_POR_CATEGORIA.get(clave(slugCategoria));
}

/**
 * ¿Esta entidad pertenece al rubro? Une las dos taxonomías: alcanza con que
 * matchee una categoría O una etiqueta.
 */
export function perteneceAlRubro(
  rubro: RubroSeo,
  entidad: { categoriaSlugs?: string[]; categoria?: string | null; tags?: string[] }
): boolean {
  const cats = new Set(rubro.catSlugs.map(clave));
  const tags = new Set(rubro.tagNombres.map(clave));

  for (const c of entidad.categoriaSlugs ?? []) {
    if (cats.has(clave(c))) return true;
  }
  // El directorio expone la categoría por NOMBRE, no por slug; comparamos
  // contra el nombre del rubro y contra sus etiquetas por las dudas.
  if (entidad.categoria && (tags.has(clave(entidad.categoria)) || clave(entidad.categoria) === clave(rubro.nombre))) {
    return true;
  }
  for (const t of entidad.tags ?? []) {
    if (tags.has(clave(t))) return true;
  }
  return false;
}
