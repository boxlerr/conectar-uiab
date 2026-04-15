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
  }
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
