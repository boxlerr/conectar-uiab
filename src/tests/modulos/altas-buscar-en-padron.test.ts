import { describe, expect, it } from 'vitest';
import {
  buscarEmpresaEnPadron,
  esSocia,
} from '@/modulos/altas/buscar-en-padron';

/**
 * Item 1.3 del reporte de Lucas: no había control contra el padrón, así que
 * /register insertaba una empresa nueva a ciegas.
 *
 * Caso real: Metalúrgica Longchamps quedó DOS veces en el directorio — la ficha
 * del padrón (aprobada, suscripción activa, CUIT "30-71232689-8") y la que creó
 * Lucas al registrarse (pendiente_revision, pendiente_pago, "30712326898"). El
 * mismo CUIT escrito distinto, que es por lo que hay que normalizar a dígitos.
 */

const PADRON = [
  {
    id: 'emp-longchamps',
    razon_social: 'METALURGICA LONGCHAMPS',
    cuit: '30-71232689-8', // con guiones, como vino del padrón importado
    n_socio: '142',
    estado: 'aprobada',
  },
  {
    id: 'emp-vaxler',
    razon_social: 'Vaxler',
    cuit: '30712326899',
    n_socio: null, // no socia: está en la plataforma pero no en el padrón UIAB
    estado: 'aprobada',
  },
  {
    id: 'emp-sin-cuit',
    razon_social: 'Sin CUIT cargado',
    cuit: null,
    n_socio: '99',
    estado: 'aprobada',
  },
];

/** Cliente Supabase mínimo: .from().select().not() devolviendo las filas dadas. */
const clienteCon = (filas: unknown[]) => ({
  from: () => ({
    select: () => ({
      not: async () => ({ data: filas }),
    }),
  }),
});

const db = clienteCon(PADRON);

describe('buscarEmpresaEnPadron', () => {
  it('encuentra la ficha aunque el CUIT venga escrito distinto', async () => {
    // Esto es el corazón del bug: sin normalizar, estos dos no matcheaban.
    const sinGuiones = await buscarEmpresaEnPadron(db, '30712326898');
    expect(sinGuiones?.id).toBe('emp-longchamps');

    const conGuiones = await buscarEmpresaEnPadron(db, '30-71232689-8');
    expect(conGuiones?.id).toBe('emp-longchamps');
  });

  it('tolera espacios, puntos y barras que tipean a mano', async () => {
    for (const escrito of ['30 71232689 8', '30.71232689.8', ' 30-71232689/8 ']) {
      const r = await buscarEmpresaEnPadron(db, escrito);
      expect(r?.id, `falló con "${escrito}"`).toBe('emp-longchamps');
    }
  });

  it('no matchea un CUIT que no está en el padrón', async () => {
    expect(await buscarEmpresaEnPadron(db, '20111111112')).toBeNull();
  });

  it('no confunde CUITs parecidos', async () => {
    // Difieren sólo en el último dígito verificador.
    const r = await buscarEmpresaEnPadron(db, '30712326899');
    expect(r?.id).toBe('emp-vaxler');
  });

  it('ignora un CUIT demasiado corto en vez de matchear basura', async () => {
    expect(await buscarEmpresaEnPadron(db, '307')).toBeNull();
    expect(await buscarEmpresaEnPadron(db, '')).toBeNull();
    expect(await buscarEmpresaEnPadron(db, null)).toBeNull();
    expect(await buscarEmpresaEnPadron(db, undefined)).toBeNull();
  });

  it('con el CUIT duplicado en el padrón no elige ninguna: lo resuelve un admin', async () => {
    const dbDuplicado = clienteCon([
      { id: 'a', razon_social: 'A', cuit: '30712326898', n_socio: '1', estado: 'aprobada' },
      { id: 'b', razon_social: 'B', cuit: '30-71232689-8', n_socio: '2', estado: 'aprobada' },
    ]);
    expect(await buscarEmpresaEnPadron(dbDuplicado, '30712326898')).toBeNull();
  });

  it('no devuelve el cuit crudo, sólo lo que necesita quien decide', async () => {
    const r = await buscarEmpresaEnPadron(db, '30712326898');
    expect(r).not.toHaveProperty('cuit');
    expect(Object.keys(r!).sort()).toEqual(['estado', 'id', 'n_socio', 'razon_social']);
  });
});

describe('esSocia', () => {
  it('n_socio cargado = socia, le corresponde acceso bonificado', async () => {
    expect(esSocia(await buscarEmpresaEnPadron(db, '30712326898'))).toBe(true);
  });

  it('sin n_socio no es socia: el acceso es arancelado', async () => {
    expect(esSocia(await buscarEmpresaEnPadron(db, '30712326899'))).toBe(false);
  });

  it('sin ficha en el padrón tampoco es socia', () => {
    expect(esSocia(null)).toBe(false);
  });
});
