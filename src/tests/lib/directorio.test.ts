import { describe, it, expect } from 'vitest';
import {
  getEmpresas,
  getProveedores,
  getEntidadBySlug,
  getCategorias,
  getEntidadesDestacadas,
  getSectoresConRecuento,
  entidades,
} from '@/lib/datos/directorio';

// ─────────────────────────────────────────────────────────────────────────────
// getEmpresas
// ─────────────────────────────────────────────────────────────────────────────
describe('getEmpresas()', () => {
  it('devuelve únicamente entidades de tipo "empresa"', () => {
    const resultado = getEmpresas();
    expect(resultado.every(e => e.tipo === 'empresa')).toBe(true);
  });

  it('no devuelve proveedores', () => {
    const resultado = getEmpresas();
    expect(resultado.some(e => e.tipo === 'proveedor')).toBe(false);
  });

  it('devuelve al menos una empresa', () => {
    expect(getEmpresas().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getProveedores
// ─────────────────────────────────────────────────────────────────────────────
describe('getProveedores()', () => {
  it('devuelve únicamente entidades de tipo "proveedor"', () => {
    const resultado = getProveedores();
    expect(resultado.every(e => e.tipo === 'proveedor')).toBe(true);
  });

  it('no devuelve empresas', () => {
    const resultado = getProveedores();
    expect(resultado.some(e => e.tipo === 'empresa')).toBe(false);
  });

  it('devuelve al menos un proveedor', () => {
    expect(getProveedores().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getEntidadBySlug
// ─────────────────────────────────────────────────────────────────────────────
describe('getEntidadBySlug()', () => {
  it('encuentra una empresa existente por slug', () => {
    const entidad = getEntidadBySlug('metaltech-industrial');
    expect(entidad).toBeDefined();
    expect(entidad?.nombre).toBe('MetalTech Industrial SA');
  });

  it('encuentra un proveedor existente por slug', () => {
    const entidad = getEntidadBySlug('consultech-industrial');
    expect(entidad).toBeDefined();
    expect(entidad?.tipo).toBe('proveedor');
  });

  it('devuelve undefined para un slug inexistente', () => {
    const entidad = getEntidadBySlug('slug-que-no-existe-jamas');
    expect(entidad).toBeUndefined();
  });

  it('la búsqueda es case-sensitive (slug en minúsculas)', () => {
    // Los slugs están en kebab-case minúsculas, mayúsculas no deben matchear
    const entidad = getEntidadBySlug('MetalTech-Industrial');
    expect(entidad).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCategorias
// ─────────────────────────────────────────────────────────────────────────────
describe('getCategorias()', () => {
  it('devuelve categorías únicas para empresas', () => {
    const cats = getCategorias('empresa');
    const unique = new Set(cats);
    expect(cats.length).toBe(unique.size);
  });

  it('devuelve categorías únicas para proveedores', () => {
    const cats = getCategorias('proveedor');
    const unique = new Set(cats);
    expect(cats.length).toBe(unique.size);
  });

  it('las categorías de empresa están ordenadas alfabéticamente', () => {
    const cats = getCategorias('empresa');
    const sorted = [...cats].sort();
    expect(cats).toEqual(sorted);
  });

  it('no mezcla categorías de empresa con proveedor', () => {
    const catEmpresas = new Set(getCategorias('empresa'));
    const catProveedores = new Set(getCategorias('proveedor'));
    // Las categorías de empresas del mock no deben coincidir con las de proveedores
    // (son dominios distintos en los datos de prueba)
    const intersection = [...catEmpresas].filter(c => catProveedores.has(c));
    expect(intersection.length).toBe(0);
  });

  it('devuelve al menos una categoría para cada tipo', () => {
    expect(getCategorias('empresa').length).toBeGreaterThan(0);
    expect(getCategorias('proveedor').length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getEntidadesDestacadas
// ─────────────────────────────────────────────────────────────────────────────
describe('getEntidadesDestacadas()', () => {
  it('devuelve únicamente entidades con destacado === true', () => {
    const destacadas = getEntidadesDestacadas();
    expect(destacadas.every(e => e.destacado === true)).toBe(true);
  });

  it('no devuelve entidades con destacado === false', () => {
    const destacadas = getEntidadesDestacadas();
    expect(destacadas.some(e => e.destacado === false)).toBe(false);
  });

  it('devuelve al menos una entidad destacada', () => {
    expect(getEntidadesDestacadas().length).toBeGreaterThan(0);
  });

  it('el total de destacadas es menor o igual al total de entidades', () => {
    expect(getEntidadesDestacadas().length).toBeLessThanOrEqual(entidades.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSectoresConRecuento
// ─────────────────────────────────────────────────────────────────────────────
describe('getSectoresConRecuento()', () => {
  it('devuelve un array de objetos con nombre y total', () => {
    const sectores = getSectoresConRecuento();
    expect(Array.isArray(sectores)).toBe(true);
    sectores.forEach(s => {
      expect(s).toHaveProperty('nombre');
      expect(s).toHaveProperty('total');
      expect(typeof s.nombre).toBe('string');
      expect(typeof s.total).toBe('number');
    });
  });

  it('todos los totales son números positivos', () => {
    const sectores = getSectoresConRecuento();
    sectores.forEach(s => {
      expect(s.total).toBeGreaterThan(0);
    });
  });

  it('devuelve al menos 5 sectores', () => {
    expect(getSectoresConRecuento().length).toBeGreaterThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integridad general del dataset
// ─────────────────────────────────────────────────────────────────────────────
describe('integridad del dataset de entidades', () => {
  it('cada entidad tiene los campos obligatorios', () => {
    const camposObligatorios = ['id', 'tipo', 'slug', 'nombre', 'categoria', 'contacto'] as const;
    entidades.forEach(e => {
      camposObligatorios.forEach(campo => {
        expect(e[campo], `Falta campo "${campo}" en entidad ${e.id}`).toBeDefined();
      });
    });
  });

  it('los slugs son únicos en todo el dataset', () => {
    const slugs = entidades.map(e => e.slug);
    const unique = new Set(slugs);
    expect(slugs.length).toBe(unique.size);
  });

  it('los IDs son únicos en todo el dataset', () => {
    const ids = entidades.map(e => e.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('el tipo de cada entidad es "empresa" o "proveedor"', () => {
    entidades.forEach(e => {
      expect(['empresa', 'proveedor']).toContain(e.tipo);
    });
  });

  it('los ratings, si existen, están entre 0 y 5', () => {
    entidades
      .filter(e => e.rating !== undefined)
      .forEach(e => {
        expect(e.rating!).toBeGreaterThanOrEqual(0);
        expect(e.rating!).toBeLessThanOrEqual(5);
      });
  });

  it('la suma de empresas y proveedores es igual al total de entidades', () => {
    const totalEmpresas = getEmpresas().length;
    const totalProveedores = getProveedores().length;
    expect(totalEmpresas + totalProveedores).toBe(entidades.length);
  });
});
