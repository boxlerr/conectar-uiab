import { Company, Provider, Review, User, Category } from '@/types';

// Admin User
export const mockAdmin: User = {
  id: 'admin-1',
  name: 'Administrador UIAB',
  email: 'admin@uiab.org.ar',
  role: 'admin',
  isMember: true,
};

// Categories
export const companyCategories: Category[] = [
  { id: 'metalmecanica-metalurgia', name: 'Metalmecánica y Metalurgia', count: 35 },
  { id: 'quimica-petroquimica', name: 'Química y Petroquímica', count: 20 },
  { id: 'alimentaria-agroindustria', name: 'Alimentaria y Agroindustria', count: 15 },
  { id: 'logistica-transporte-deposito', name: 'Logística, Transporte y Depósito', count: 12 },
  { id: 'servicios-profesionales', name: 'Servicios Profesionales y Consultoría', count: 18 },
];

export const providerSpecialties: Category[] = [
  { id: 'ingenieria-consultora', name: 'Ingeniería y Consultoría Técnica', count: 32 },
  { id: 'contabilidad-impuestos', name: 'Contabilidad, Impuestos y Auditoría', count: 28 },
  { id: 'informatica-sistemas', name: 'Informática, Sistemas y Soporte IT', count: 24 },
  { id: 'mantenimiento-electrico', name: 'Mantenimiento Eléctrico e Instrumental', count: 45 },
  { id: 'refrigeracion', name: 'Refrigeración y Aire Acondicionado', count: 19 },
];

// Helper to generate a large amount of companies
const generateCompanies = (count: number): Company[] => {
  const categories = ['Metalmecánica y Metalurgia', 'Química y Petroquímica', 'Alimentaria y Agroindustria', 'Logística, Transporte y Depósito', 'Servicios Profesionales y Consultoría'];
  const companies: Company[] = [];
  
  for (let i = 1; i <= count; i++) {
    const isApproved = i <= count * 0.9; // 90% approved, 10% pending
    const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);
    
    companies.push({
      id: `comp-${i}`,
      name: `Empresa Industrial ${i} S.A.`,
      description: `Somos una empresa líder en el sector ${categories[i % categories.length].toLowerCase()} con más de 10 años de experiencia brindando soluciones integrales en el Partido de Almirante Brown.`,
      category: categories[i % categories.length],
      rating: parseFloat(rating),
      reviewCount: Math.floor(Math.random() * 50) + 1,
      status: isApproved ? 'approved' : 'pending',
      contactEmail: `contacto@empresa${i}.com.ar`,
      phone: `+54 11 4000-${1000 + i}`,
      address: `Almirante Brown, Calle ${i}`,
      servicesOffered: ['Servicio A', 'Soporte Técnico', 'Consultoría'],
    });
  }
  return companies;
};

// Helper to generate providers
const generateProviders = (count: number): Provider[] => {
  const specialties = ['Ingeniería y Consultoría Técnica', 'Contabilidad, Impuestos y Auditoría', 'Informática, Sistemas y Soporte IT', 'Mantenimiento Eléctrico e Instrumental', 'Refrigeración y Aire Acondicionado'];
  const providers: Provider[] = [];
  
  for (let i = 1; i <= count; i++) {
    const isApproved = i <= count * 0.85; // 85% approved
    const rating = (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);
    
    providers.push({
      id: `prov-${i}`,
      name: `Proveedor ${i} - ${specialties[i % specialties.length].split(' ')[0]}`,
      specialty: specialties[i % specialties.length],
      description: `Especialista matriculado con amplia experiencia en mantenimiento e instalaciones para el sector industrial. Compromiso y garantía en cada trabajo.`,
      rating: parseFloat(rating),
      reviewCount: Math.floor(Math.random() * 30) + 1,
      status: isApproved ? 'approved' : 'pending',
      contactEmail: `proveedor${i}@gmail.com`,
      phone: `+54 11 5000-${2000 + i}`,
      zone: 'Zona Sur / Almirante Brown',
      experienceYears: Math.floor(Math.random() * 15) + 5,
      certifications: ['Matrícula Nacional', 'Curso de Seguridad Industrial'],
    });
  }
  return providers;
};

export const mockedCompanies = generateCompanies(100);
export const mockedProviders = generateProviders(100);

export const mockedReviews: Review[] = [
  {
    id: 'rev-1',
    targetId: 'prov-1',
    authorId: 'comp-1',
    authorName: 'Empresa Industrial 1 S.A.',
    rating: 5,
    comment: 'Excelente servicio, solucionó el problema eléctrico de la nave de producción muy rápido.',
    date: '2026-03-01',
    status: 'approved'
  },
  {
    id: 'rev-2',
    targetId: 'comp-2',
    authorId: 'comp-3',
    authorName: 'Empresa Industrial 3 S.A.',
    rating: 4,
    comment: 'Muy buenos proveedores de materia prima química, excelente calidad aunque la entrega demoró un día.',
    date: '2026-03-05',
    status: 'pending'
  }
];
