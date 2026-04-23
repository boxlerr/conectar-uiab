export type UserRole = 'admin' | 'company' | 'provider' | 'guest';
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
  subscriptionEstado: string | null; // 'activa' | 'pendiente_pago' | 'en_mora' | 'suspendida' | 'cancelada' | null
  /** Mapa seccion -> timestamp ISO (o null si no lo vio). Persistido en perfiles.tutoriales_vistos. */
  tutorialesVistos?: Record<string, string | null>;
  /** Estado de la entidad (empresa/proveedor) — 'pendiente_revision' | 'aprobada'/'aprobado' | 'rechazada'/'rechazado'. */
  entidadEstado?: string | null;
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
