export type UserRole = 'admin' | 'company' | 'provider' | 'guest';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isMember: boolean; // Relevant if they are part of UIAB
  entityId?: string | null; // ID in 'empresas' or 'proveedores' table
}

export interface Review {
  id: string;
  targetId: string; // ID of the company or provider being reviewed
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
  status: ApprovalStatus;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  category: string; // e.g. Metalúrgica, Química, Logística
  rating: number;
  reviewCount: number;
  status: ApprovalStatus;
  contactEmail: string;
  phone: string;
  address: string;
  website?: string;
  logoUrl?: string;
  servicesOffered: string[];
}

export interface Provider {
  id: string;
  name: string;
  specialty: string; // e.g. Gasista, Electricista, Techista
  description: string;
  rating: number;
  reviewCount: number;
  status: ApprovalStatus;
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
