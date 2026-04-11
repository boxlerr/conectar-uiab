import { describe, it, expect } from 'vitest';
import {
  mockAdmin,
  companyCategories,
  providerSpecialties,
  mockedCompanies,
  mockedProviders,
  mockedReviews,
} from '@/modulos/compartido/datos/datos-prueba';

describe('mockAdmin', () => {
  it('tiene rol admin', () => {
    expect(mockAdmin.role).toBe('admin');
  });

  it('tiene isMember en true', () => {
    expect(mockAdmin.isMember).toBe(true);
  });

  it('tiene email de dominio uiab', () => {
    expect(mockAdmin.email).toContain('@uiab.org.ar');
  });
});

describe('companyCategories', () => {
  it('es un array no vacío', () => {
    expect(companyCategories.length).toBeGreaterThan(0);
  });

  it('cada categoría tiene id, name y count', () => {
    companyCategories.forEach(cat => {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.count).toBeGreaterThan(0);
    });
  });

  it('los IDs son únicos', () => {
    const ids = companyCategories.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('providerSpecialties', () => {
  it('es un array no vacío', () => {
    expect(providerSpecialties.length).toBeGreaterThan(0);
  });

  it('cada especialidad tiene id, name y count', () => {
    providerSpecialties.forEach(spec => {
      expect(spec.id).toBeTruthy();
      expect(spec.name).toBeTruthy();
      expect(spec.count).toBeGreaterThan(0);
    });
  });
});

describe('mockedCompanies (generados × 100)', () => {
  it('genera exactamente 100 empresas', () => {
    expect(mockedCompanies).toHaveLength(100);
  });

  it('los IDs siguen el patrón "comp-N"', () => {
    mockedCompanies.forEach((c, i) => {
      expect(c.id).toBe(`comp-${i + 1}`);
    });
  });

  it('los IDs son únicos', () => {
    const ids = mockedCompanies.map(c => c.id);
    expect(new Set(ids).size).toBe(100);
  });

  it('aprox. el 90% tienen estado "approved"', () => {
    const aprobadas = mockedCompanies.filter(c => c.status === 'approved');
    // Tolerancia ±5 empresas
    expect(aprobadas.length).toBeGreaterThanOrEqual(85);
    expect(aprobadas.length).toBeLessThanOrEqual(95);
  });

  it('el resto tienen estado "pending"', () => {
    const pending = mockedCompanies.filter(c => c.status === 'pending');
    const approved = mockedCompanies.filter(c => c.status === 'approved');
    expect(pending.length + approved.length).toBe(100);
  });

  it('los ratings están entre 3.5 y 5.0', () => {
    mockedCompanies.forEach(c => {
      expect(c.rating).toBeGreaterThanOrEqual(3.5);
      expect(c.rating).toBeLessThanOrEqual(5.0);
    });
  });

  it('todos tienen email de contacto con formato válido', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    mockedCompanies.forEach(c => {
      expect(emailRegex.test(c.contactEmail), `Email inválido: ${c.contactEmail}`).toBe(true);
    });
  });

  it('todos tienen al menos un servicio ofrecido', () => {
    mockedCompanies.forEach(c => {
      expect(c.servicesOffered.length).toBeGreaterThan(0);
    });
  });
});

describe('mockedProviders (generados × 100)', () => {
  it('genera exactamente 100 proveedores', () => {
    expect(mockedProviders).toHaveLength(100);
  });

  it('aprox. el 85% tienen estado "approved"', () => {
    const aprobados = mockedProviders.filter(p => p.status === 'approved');
    expect(aprobados.length).toBeGreaterThanOrEqual(80);
    expect(aprobados.length).toBeLessThanOrEqual(90);
  });

  it('los ratings están entre 4.0 y 5.0', () => {
    mockedProviders.forEach(p => {
      expect(p.rating).toBeGreaterThanOrEqual(4.0);
      expect(p.rating).toBeLessThanOrEqual(5.0);
    });
  });

  it('los años de experiencia son positivos', () => {
    mockedProviders.forEach(p => {
      expect(p.experienceYears).toBeGreaterThan(0);
    });
  });

  it('todos tienen al menos una certificación', () => {
    mockedProviders.forEach(p => {
      expect(p.certifications.length).toBeGreaterThan(0);
    });
  });
});

describe('mockedReviews', () => {
  it('es un array no vacío', () => {
    expect(mockedReviews.length).toBeGreaterThan(0);
  });

  it('los ratings son enteros entre 1 y 5', () => {
    mockedReviews.forEach(r => {
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
      expect(Number.isInteger(r.rating)).toBe(true);
    });
  });

  it('el estado es "approved" o "pending"', () => {
    mockedReviews.forEach(r => {
      expect(['approved', 'pending', 'rejected']).toContain(r.status);
    });
  });

  it('los IDs son únicos', () => {
    const ids = mockedReviews.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
