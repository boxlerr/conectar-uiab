export type UserRole = 'admin' | 'company' | 'provider' | 'guest';
/**
 * Qué clase de ficha administra un perfil. Es distinto de `UserRole`: el rol
 * dice qué permisos tenés, esto dice de qué entidad sos dueño. Un admin puede
 * ser además dueño de su propia empresa (es el caso de Vaxler) y necesita
 * poder configurarla desde /perfil como cualquier socia.
 */
export type TipoEntidadPerfil = 'company' | 'provider';
export type EstadoEmpresa = 'borrador' | 'pendiente_revision' | 'aprobada' | 'rechazada' | 'pausada' | 'oculta';
export type EstadoProveedor = 'borrador' | 'pendiente_revision' | 'aprobado' | 'rechazado' | 'pausado' | 'oculto';
export type EstadoResena = 'pendiente_revision' | 'aprobada' | 'rechazada' | 'oculta';
export type NivelTarifa = 1 | 2 | 3;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isMember: boolean; // Relevant if they are part of UIAB
  entityId?: string | null; // ID in 'empresas' or 'proveedores' table
  /**
   * Tipo de la ficha que administra este perfil, resuelto por membresía real
   * (miembros_empresa / miembros_proveedor) y NO por `role`. Para company y
   * provider coincide con el rol; para un admin con ficha propia es lo único
   * que dice si hay que leer `empresas` o `proveedores`. null = no tiene ficha.
   */
  entityRole?: TipoEntidadPerfil | null;
  subscriptionEstado: string | null; // 'activa' | 'pendiente_pago' | 'en_mora' | 'suspendida' | 'cancelada' | null
  /** Mapa seccion -> timestamp ISO (o null si no lo vio). Persistido en perfiles.tutoriales_vistos. */
  tutorialesVistos?: Record<string, string | null>;
  /**
   * ISO de `perfiles.creado_en`. Se usa para no anunciarle "novedades" a quien
   * creó la cuenta después de que salieron: para esa persona no son nuevas.
   */
  creadoEn?: string | null;
  /** Estado de la entidad (empresa/proveedor) — 'pendiente_revision' | 'aprobada'/'aprobado' | 'rechazada'/'rechazado'. */
  entidadEstado?: string | null;
  /** URL pública del logo/avatar de la entidad. Se muestra en el avatar del header. */
  logoUrl?: string | null;
}

export interface Review {
  id: string;
  targetId: string; // ID of the company or provider being reviewed
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
  status: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  category: string; // e.g. Metalúrgica, Química, Logística
  rating: number;
  reviewCount: number;
  status: string;
  contactEmail: string;
  phone: string;
  address: string;
  website?: string;
  logoUrl?: string;
  servicesOffered: string[];
  tarifa?: NivelTarifa;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string; // e.g. Gasista, Electricista, Techista
  description: string;
  rating: number;
  reviewCount: number;
  status: string;
  contactEmail: string;
  phone: string;
  zone: string; // Areas they cover
  experienceYears: number;
  certifications: string[];
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}
