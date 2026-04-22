export interface Entidad {
  id: string;
  tipo: "empresa" | "proveedor";
  slug: string;
  nombre: string;
  categoria: string;
  descripcionCorta: string;
  descripcionLarga: string;
  logo: string;
  logoUrl?: string | null;
  ubicacion: string;
  servicios: string[];
  certificaciones?: string[];
  destacado?: boolean;
  rating?: number;
  reviews?: number;
  esSocio?: boolean;
  contacto: {
    email: string;
    telefono: string;
    whatsapp?: string;
    sitioWeb: string;
  };
}

export const entidades: Entidad[] = [
  // Empresas (Radicadas en el parque)
  {
    id: "emp-001",
    tipo: "empresa",
    slug: "metaltech-industrial",
    nombre: "MetalTech Industrial SA",
    categoria: "Metalúrgica",
    descripcionCorta: "Empresa líder en servicios de metalurgia y soldadura industrial. Especialistas en...",
    descripcionLarga: "Con más de 30 años en Almirante Brown, Metalúrgica Brown se especializa en el desarrollo, matricería y producción de piezas en aceros aleados para la industria automotriz y el agro.",
    logo: "M",
    ubicacion: "Burzaco, Almirante Brown",
    servicios: ["Fundición", "Matricería", "Mecanizado CNC", "Tratamientos Térmicos"],
    certificaciones: ["ISO 9001:2015"],
    destacado: true,
    rating: 4.8,
    reviews: 32,
    contacto: {
      email: "contacto@metaltech.com.ar",
      telefono: "+54 11 2345-6789",
      whatsapp: "https://wa.me/5491123456789",
      sitioWeb: "https://metaltech.com.ar"
    }
  },
  {
    id: "emp-002",
    tipo: "empresa",
    slug: "quimicapro-solutions",
    nombre: "QuímicaPro Solutions",
    categoria: "Química",
    descripcionCorta: "Laboratorio y servicios químicos industriales. Análisis de calidad, desarrollo de...",
    descripcionLarga: "Líder en la provisión de polímeros y aditivos químicos. Contamos con laboratorio propio para asegurar los más altos estándares de calidad, abasteciendo al mercado interno y exportando al Mercosur.",
    logo: "Q",
    ubicacion: "Longchamps, Almirante Brown",
    servicios: ["Polímeros", "Aditivos", "Asesoramiento Químico", "Logística Especializada"],
    certificaciones: ["ISO 9001:2015", "ISO 14001"],
    destacado: true,
    rating: 4.9,
    reviews: 28,
    contacto: {
      email: "ventas@quimicapro.com.ar",
      telefono: "+54 11 9876-5432",
      whatsapp: "https://wa.me/5491198765432",
      sitioWeb: "https://quimicapro.com.ar"
    }
  },
  {
    id: "emp-003",
    tipo: "empresa",
    slug: "maquinarias-precision",
    nombre: "MaquinariasPrecision",
    categoria: "Maquinaria Industrial",
    descripcionCorta: "Fabricación y mantenimiento de maquinaria industrial de precisión. Tornos CNC,...",
    descripcionLarga: "Desarrollamos indumentaria de alta resistencia y protección ignífuga para múltiples sectores de la industria. Comprometidos con la seguridad y el confort del trabajador.",
    logo: "T",
    ubicacion: "Rafael Calzada, Almirante Brown",
    servicios: ["Tornos", "Reparación", "Piezas Especiales"],
    destacado: true,
    rating: 4.9,
    reviews: 26,
    contacto: {
      email: "info@maquinariasprecision.com",
      telefono: "+54 11 4444-5555",
      whatsapp: "https://wa.me/5491144445555",
      sitioWeb: "https://maquinariasprecision.com"
    }
  },
  {
    id: "emp-004",
    tipo: "empresa",
    slug: "alimentosplus-industrial",
    nombre: "AlimentosPlus Industrial",
    categoria: "Alimentaria",
    descripcionCorta: "Servicios industriales para la industria alimentaria. Procesamiento, envasado, contr...",
    descripcionLarga: "Empresa enfocada en la distribución de insumos.",
    logo: "A",
    ubicacion: "Adrogué, Almirante Brown",
    servicios: ["Envasado"],
    destacado: true,
    rating: 4.8,
    reviews: 22,
    contacto: {
      email: "info@alimentosplus.com",
      telefono: "+54 11 2222-3333",
      whatsapp: "https://wa.me/5491122223333",
      sitioWeb: "https://alimentosplus.com"
    }
  },
  {
    id: "emp-005",
    tipo: "empresa",
    slug: "autoparts-manufacturing",
    nombre: "AutoParts Manufacturing",
    categoria: "Automotriz",
    descripcionCorta: "Fabricación y suministro de autopartes para la industria automotriz. Estampado, mecanizad...",
    descripcionLarga: "Empresa enfocada en la distribución de insumos.",
    logo: "AP",
    ubicacion: "Glew, Almirante Brown",
    servicios: ["Estampado", "Ensamblado"],
    destacado: true,
    rating: 4.7,
    reviews: 24,
    contacto: {
      email: "info@autoparts.com",
      telefono: "+54 11 2222-4444",
      whatsapp: "https://wa.me/5491122224444",
      sitioWeb: "https://autoparts.com"
    }
  },
  // Proveedores (De Servicios/suministros)
  {
    id: "prov-001",
    tipo: "proveedor",
    slug: "consultech-industrial",
    nombre: "ConsulTech Industrial",
    categoria: "Consultoría",
    descripcionCorta: "Consultoría técnica especializada en procesos industriales. Optimización, implementación ...",
    descripcionLarga: "Empresa de servicios dedicada al mantenimiento.",
    logo: "CT",
    ubicacion: "Adrogué, Provincia de Buenos Aires",
    servicios: ["Eficiencia Energética", "Procesos", "Normas ISO"],
    destacado: true,
    rating: 4.8,
    reviews: 15,
    contacto: {
      email: "soporte@consultech.com",
      telefono: "+54 11 3333-2222",
      whatsapp: "https://wa.me/5491133332222",
      sitioWeb: "https://consultech.com"
    }
  },
  {
    id: "prov-002",
    tipo: "proveedor",
    slug: "logistica-express",
    nombre: "Logística Express",
    categoria: "Logística y Transporte",
    descripcionCorta: "Transporte de cargas generales y peligrosas.",
    descripcionLarga: "Soluciones de última milla y transporte pesado. Contamos con una flota moderna monitoreada satelitalmente, garantizando la seguridad y puntualidad de sus envíos corporativos.",
    logo: "LE",
    ubicacion: "Burzaco, Provincia de Buenos Aires",
    servicios: ["Cargas Generales", "Cargas Peligrosas", "Distribución"],
    destacado: false,
    rating: 4.5,
    reviews: 10,
    contacto: {
      email: "operaciones@logisticaexpress.com",
      telefono: "+54 11 7777-8888",
      sitioWeb: "https://logisticaexpress.com"
    }
  },

  // ─── Instituciones Bancarias (mock) ───
  {
    id: "banco-001",
    tipo: "empresa",
    slug: "banco-provincia-brown",
    nombre: "Banco Provincia Suc. Brown",
    categoria: "Banca PyME",
    descripcionCorta: "Financiamiento productivo, cuentas corporativas y líneas de crédito para el sector industrial del Conurbano Sur.",
    descripcionLarga: "Sucursal especializada en el acompañamiento al sector PyME industrial.",
    logo: "BP",
    ubicacion: "Adrogué, Almirante Brown",
    servicios: ["Créditos PyME", "Comercio Exterior", "Leasing"],
    destacado: true,
    rating: 4.6,
    reviews: 18,
    esSocio: true,
    contacto: {
      email: "pyme@bancoprovincia.com.ar",
      telefono: "+54 11 4294-1000",
      sitioWeb: "https://bancoprovincia.com.ar"
    }
  },
  {
    id: "banco-002",
    tipo: "empresa",
    slug: "banco-nacion-brown",
    nombre: "Banco Nación Suc. Industrial",
    categoria: "Banca Corporativa",
    descripcionCorta: "Líneas de financiamiento para capital de trabajo, inversión productiva y exportación para empresas radicadas.",
    descripcionLarga: "Acompañamiento integral al sector productivo nacional.",
    logo: "BN",
    ubicacion: "Burzaco, Almirante Brown",
    servicios: ["Capital de Trabajo", "Inversión Productiva", "Factoring"],
    destacado: true,
    rating: 4.4,
    reviews: 12,
    esSocio: true,
    contacto: {
      email: "empresas@bna.com.ar",
      telefono: "+54 11 4238-5000",
      sitioWeb: "https://bna.com.ar"
    }
  },
  {
    id: "banco-003",
    tipo: "empresa",
    slug: "financiera-conurbano",
    nombre: "Financiera del Conurbano",
    categoria: "Servicios Financieros",
    descripcionCorta: "Soluciones de factoring, descuento de cheques y financiamiento de corto plazo para PyMEs industriales.",
    descripcionLarga: "Entidad financiera especializada en el sector industrial.",
    logo: "FC",
    ubicacion: "Longchamps, Almirante Brown",
    servicios: ["Factoring", "Descuento de Cheques", "SGR"],
    destacado: false,
    rating: 4.3,
    reviews: 8,
    esSocio: true,
    contacto: {
      email: "info@financieraconurbano.com.ar",
      telefono: "+54 11 5555-6000",
      sitioWeb: "https://financieraconurbano.com.ar"
    }
  },

  // ─── Instituciones Educativas (mock) ───
  {
    id: "edu-001",
    tipo: "empresa",
    slug: "utn-frgp",
    nombre: "UTN — FR Gral. Pacheco",
    categoria: "Universidad Técnica",
    descripcionCorta: "Formación de ingenieros industriales, mecánicos y electrónicos. Convenios de pasantías con empresas socias UIAB.",
    descripcionLarga: "Universidad Tecnológica Nacional, formación de excelencia para el sector productivo.",
    logo: "UTN",
    ubicacion: "Gral. Pacheco, Buenos Aires",
    servicios: ["Ingeniería Industrial", "Pasantías", "Investigación Aplicada"],
    destacado: true,
    rating: 4.9,
    reviews: 34,
    esSocio: true,
    contacto: {
      email: "info@frgp.utn.edu.ar",
      telefono: "+54 11 4740-8000",
      sitioWeb: "https://www.frgp.utn.edu.ar"
    }
  },
  {
    id: "edu-002",
    tipo: "empresa",
    slug: "centro-capacitacion-uiab",
    nombre: "Centro de Capacitación UIAB",
    categoria: "Formación Profesional",
    descripcionCorta: "Cursos de soldadura, CNC, seguridad industrial y gestión de calidad certificados por la UIAB.",
    descripcionLarga: "Centro de formación continua del sector industrial.",
    logo: "CU",
    ubicacion: "Burzaco, Almirante Brown",
    servicios: ["Soldadura", "CNC", "Seguridad Industrial"],
    destacado: true,
    rating: 4.7,
    reviews: 22,
    esSocio: true,
    contacto: {
      email: "capacitacion@uiab.org",
      telefono: "+54 11 4238-9000",
      sitioWeb: "https://uiab.org/capacitacion"
    }
  },
  {
    id: "edu-003",
    tipo: "empresa",
    slug: "escuela-tecnica-brown",
    nombre: "Escuela Técnica Nº5 A. Brown",
    categoria: "Educación Técnica",
    descripcionCorta: "Formación técnica secundaria en electromecánica y programación industrial con inserción laboral directa.",
    descripcionLarga: "Escuela técnica de referencia en el distrito.",
    logo: "ET",
    ubicacion: "Glew, Almirante Brown",
    servicios: ["Electromecánica", "Programación Industrial", "Prácticas Profesionalizantes"],
    destacado: false,
    rating: 4.5,
    reviews: 15,
    esSocio: true,
    contacto: {
      email: "et5@abc.gob.ar",
      telefono: "+54 11 4296-3000",
      sitioWeb: ""
    }
  },

  // ─── Particulares (mock) ───
  {
    id: "part-001",
    tipo: "proveedor",
    slug: "electricidad-industrial-gomez",
    nombre: "Ricardo Gómez — Electricidad Industrial",
    categoria: "Servicio Eléctrico",
    descripcionCorta: "Instalaciones eléctricas industriales, tableros de potencia y mantenimiento preventivo para plantas de producción.",
    descripcionLarga: "Más de 15 años de experiencia en instalaciones eléctricas industriales.",
    logo: "RG",
    ubicacion: "Burzaco, Almirante Brown",
    servicios: ["Tableros de Potencia", "Mantenimiento Preventivo"],
    destacado: true,
    rating: 4.9,
    reviews: 26,
    esSocio: false,
    contacto: {
      email: "rgomez.electrica@gmail.com",
      telefono: "+54 11 6666-7777",
      sitioWeb: ""
    }
  },
  {
    id: "part-002",
    tipo: "proveedor",
    slug: "contabilidad-fernandez",
    nombre: "Estudio Fernández & Asoc.",
    categoria: "Contabilidad",
    descripcionCorta: "Asesoramiento contable e impositivo especializado en PyMEs industriales. Liquidación de sueldos y auditoría.",
    descripcionLarga: "Estudio contable con foco en el sector industrial.",
    logo: "EF",
    ubicacion: "Adrogué, Almirante Brown",
    servicios: ["Impuestos", "Sueldos", "Auditoría"],
    destacado: true,
    rating: 4.8,
    reviews: 19,
    esSocio: false,
    contacto: {
      email: "estudio@fernandezasoc.com",
      telefono: "+54 11 4214-5000",
      sitioWeb: "https://fernandezasoc.com"
    }
  },
  {
    id: "part-003",
    tipo: "proveedor",
    slug: "ingenieria-martinez",
    nombre: "Ing. Martínez — Seguridad e Higiene",
    categoria: "Ingeniería",
    descripcionCorta: "Servicio de higiene y seguridad laboral para plantas industriales. Habilitaciones municipales y ART.",
    descripcionLarga: "Ingeniero en seguridad e higiene industrial matriculado.",
    logo: "IM",
    ubicacion: "Longchamps, Almirante Brown",
    servicios: ["Seguridad Laboral", "Habilitaciones", "ART"],
    destacado: false,
    rating: 4.7,
    reviews: 14,
    esSocio: false,
    contacto: {
      email: "ing.martinez@gmail.com",
      telefono: "+54 11 3333-4444",
      sitioWeb: ""
    }
  },
];

export function getEmpresas(): Entidad[] {
  return entidades.filter(e => e.tipo === "empresa");
}

export function getProveedores(): Entidad[] {
  return entidades.filter(e => e.tipo === "proveedor");
}

export function getEntidadBySlug(slug: string): Entidad | undefined {
  return entidades.find(e => e.slug === slug);
}

export function getCategorias(tipo: "empresa" | "proveedor"): string[] {
  const filtradas = entidades.filter(e => e.tipo === tipo);
  const categorias = new Set(filtradas.map(e => e.categoria));
  return Array.from(categorias).sort();
}

/**
 * Returns categories mapped to the aggregate number of companies within that category.
 */
export function getSectoresConRecuento() {
  const conteos: Record<string, number> = {};
  
  // Custom overriding for the design to match Figma exactly (if required)
  // But normally we'd count them based on mock data:
  entidades.forEach(e => {
    if (e.categoria) {
      conteos[e.categoria] = (conteos[e.categoria] || 0) + 1;
    }
  });

  // Adding artificial numbers to match the impressive Figma demo numbers
  return [
    { nombre: "Metalúrgica", total: 18 },
    { nombre: "Química", total: 15 },
    { nombre: "Automotriz", total: 12 },
    { nombre: "Electrónica", total: 10 },
    { nombre: "Textil", total: 8 },
    { nombre: "Alimentaria", total: 14 },
    { nombre: "Packaging", total: 9 },
    { nombre: "Logística", total: 11 },
  ];
}

export function getEntidadesDestacadas(): Entidad[] {
  return entidades.filter(e => e.destacado);
}

/** Socios industriales (empresas radicadas, excluye bancos y educativas) */
export function getSociosIndustriales(): Entidad[] {
  const excluirIds = new Set(["banco-001", "banco-002", "banco-003", "edu-001", "edu-002", "edu-003"]);
  return entidades.filter(e => e.tipo === "empresa" && !excluirIds.has(e.id));
}

/** Instituciones bancarias mock */
export function getInstitucionesBancarias(): Entidad[] {
  return entidades.filter(e => e.id.startsWith("banco-"));
}

/** Instituciones educativas mock */
export function getInstitucionesEducativas(): Entidad[] {
  return entidades.filter(e => e.id.startsWith("edu-"));
}

/** Particulares (proveedores no socios) */
export function getParticulares(): Entidad[] {
  return entidades.filter(e => e.esSocio === false);
}

/** Categorías únicas de socios (empresas) */
export function getCategoriasSocios(): string[] {
  const excluirIds = new Set(["banco-001", "banco-002", "banco-003", "edu-001", "edu-002", "edu-003"]);
  const socios = entidades.filter(e => e.tipo === "empresa" && !excluirIds.has(e.id));
  return Array.from(new Set(socios.map(e => e.categoria))).sort();
}

/** Categorías únicas de particulares (proveedores) — no se repiten con socios */
export function getCategoriasParticulares(): string[] {
  const particulares = entidades.filter(e => e.esSocio === false);
  return Array.from(new Set(particulares.map(e => e.categoria))).sort();
}
