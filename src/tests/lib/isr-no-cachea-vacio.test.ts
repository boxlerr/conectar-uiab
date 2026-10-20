import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Una página ISR no puede cachear lo que devolvió un render con Supabase
 * caído. Pasó el 2026-10-20: /rubros quedó cacheado con "0 EMPRESAS" en todos
 * los rubros. Las lecturas que usan las páginas ISR tiran; las mismas
 * funciones, llamadas desde páginas dinámicas, se siguen degradando a vacío.
 */

vi.mock('server-only', () => ({}));

const { respuesta } = vi.hoisted(() => ({
  respuesta: { valor: { data: null as unknown, error: null as { message: string } | null } },
}));

function builder() {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'not', 'in']) b[m] = () => b;
  b.then = (ok: (v: unknown) => unknown, mal?: (e: unknown) => unknown) =>
    Promise.resolve(respuesta.valor).then(ok, mal);
  return b;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => builder(),
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: 'https://x/logo.png' } }) }) },
  }),
}));

import { exigirDatos } from '@/lib/cache/isr';
import { obtenerSociasConLogo } from '@/lib/datos/socias-logos';
import { obtenerDirectorio } from '@/app/directorio/datos';
import { getComunicadosPublicados } from '@/modulos/boletin/consultas';

const timeout = { data: null, error: { message: 'canceling statement due to statement timeout' } };

beforeEach(() => {
  respuesta.valor = { data: [], error: null };
});

describe('exigirDatos', () => {
  it('devuelve el resultado si no hubo error', () => {
    const res = { data: [1, 2], error: null };
    expect(exigirDatos(res, 'algo')).toBe(res);
  });

  it('tira con el mensaje de Supabase si hubo error', () => {
    expect(() => exigirDatos(timeout, 'las empresas')).toThrow(/las empresas: canceling statement/);
  });
});

describe('con Supabase caído', () => {
  beforeEach(() => {
    respuesta.valor = timeout;
  });

  it('el directorio tira para una página ISR y devuelve vacío para una dinámica', async () => {
    await expect(obtenerDirectorio({ tirarSiFalla: true })).rejects.toThrow(/\[isr\]/);
    await expect(obtenerDirectorio()).resolves.toMatchObject({ entidades: [] });
  });

  it('los logos de la portada tiran para ISR y se degradan para el resto', async () => {
    await expect(obtenerSociasConLogo({ tirarSiFalla: true })).rejects.toThrow(/\[isr\]/);
    await expect(obtenerSociasConLogo()).resolves.toEqual([]);
  });

  it('el boletín tira para /boletin y devuelve vacío para el panel', async () => {
    await expect(getComunicadosPublicados(undefined, { tirarSiFalla: true })).rejects.toThrow(/\[isr\]/);
    await expect(getComunicadosPublicados(3)).resolves.toEqual([]);
  });
});
