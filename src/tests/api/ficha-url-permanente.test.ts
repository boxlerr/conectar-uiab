import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * `/e/{id}` es la URL que se le reparte a las socias para que la peguen en su
 * propio sitio. Su único contrato es: **el 308 tiene que aterrizar en una ficha
 * que existe**. Si el slug que calcula esta ruta se separa alguna vez del que
 * calcula `/empresas/[slug]`, cada backlink alojado en un dominio ajeno pasa a
 * apuntar a un 404 y no vamos a poder editarlos.
 *
 * Por eso los tests de particulares no comparan contra una constante escrita a
 * mano: replican la misma regla que usa la ficha (`nombre_comercial` primero,
 * `nombre + apellido` después) y verifican que coincidan.
 */

// ─── Mock del cliente admin ──────────────────────────────────────────────────
// Antes de importar la ruta, para que no intente conectarse a Supabase real.
const mockEmpresa = vi.fn();
const mockProveedor = vi.fn();
let romperLaBase = false;

function consulta(resolver: () => Promise<unknown>) {
  const cadena: Record<string, unknown> = {};
  cadena.select = vi.fn(() => cadena);
  cadena.eq = vi.fn(() => cadena);
  cadena.maybeSingle = vi.fn(resolver);
  return cadena;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => {
    if (romperLaBase) throw new Error('Postgres caído');
    return {
      from: (tabla: string) =>
        consulta(tabla === 'empresas' ? mockEmpresa : mockProveedor),
    };
  }),
}));

// ─── Mock de next/server ─────────────────────────────────────────────────────
vi.mock('next/server', () => ({
  NextResponse: class {
    status: number;
    headers: Headers;
    constructor(_cuerpo?: unknown, init?: ResponseInit) {
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers);
    }
    static redirect(url: URL, status: number) {
      return { status, headers: new Headers({ location: url.toString() }) };
    }
  },
}));

import { GET } from '@/app/e/[id]/route';
import { crearSlug } from '@/lib/utilidades';

const ID = '3f1a9c2e-7b4d-4e8a-9c1f-2d5e6a7b8c90';
const ORIGEN = 'https://www.uiabconecta.com';

function pedir(id: string) {
  return GET(
    { nextUrl: { origin: ORIGEN } } as never,
    { params: Promise.resolve({ id }) }
  );
}

const destino = (r: { headers: Headers }) => r.headers.get('location');

beforeEach(() => {
  romperLaBase = false;
  mockEmpresa.mockReset().mockResolvedValue({ data: null });
  mockProveedor.mockReset().mockResolvedValue({ data: null });
});

describe('/e/{id} — URL permanente de una ficha', () => {
  it('un id que no es UUID da 404 sin tocar la base', async () => {
    const r = await pedir('../../admin');
    expect(r.status).toBe(404);
    expect(mockEmpresa).not.toHaveBeenCalled();
  });

  it('una empresa aprobada redirige 308 al slug de su razón social', async () => {
    mockEmpresa.mockResolvedValue({ data: { razon_social: 'Metalúrgica Longchamps S.A.' } });
    const r = await pedir(ID);
    expect(r.status).toBe(308);
    expect(destino(r)).toBe(
      `${ORIGEN}/empresas/${crearSlug('Metalúrgica Longchamps S.A.')}`
    );
  });

  it('el 308 es permanente, no temporal: transfiere el ranking al destino', async () => {
    mockEmpresa.mockResolvedValue({ data: { razon_social: 'Tecza' } });
    expect((await pedir(ID)).status).toBe(308);
  });

  it('un particular usa nombre_comercial, igual que la ficha', async () => {
    const fila = { nombre_comercial: 'Estudio Pérez', nombre: 'Ana', apellido: 'Pérez' };
    mockProveedor.mockResolvedValue({ data: fila });
    // La misma regla que aplica /empresas/[slug]: nombre_comercial gana.
    const esperado = crearSlug(fila.nombre_comercial);
    expect(destino(await pedir(ID))).toBe(`${ORIGEN}/empresas/${esperado}`);
  });

  it('un particular sin nombre_comercial cae a nombre + apellido', async () => {
    const fila = { nombre_comercial: null, nombre: 'Ana', apellido: 'Pérez' };
    mockProveedor.mockResolvedValue({ data: fila });
    const esperado = crearSlug([fila.nombre, fila.apellido].filter(Boolean).join(' '));
    expect(destino(await pedir(ID))).toBe(`${ORIGEN}/empresas/${esperado}`);
    expect(esperado).toBe('ana-perez');
  });

  it('una entidad que no está aprobada da 404, no filtra altas sin publicar', async () => {
    // Los mocks devuelven null porque la ruta filtra por estado en la consulta.
    expect((await pedir(ID)).status).toBe(404);
  });

  it('un particular sin ningún nombre usable da 404 en vez de /empresas/', async () => {
    mockProveedor.mockResolvedValue({ data: { nombre_comercial: null, nombre: null, apellido: null } });
    expect((await pedir(ID)).status).toBe(404);
  });

  it('con la base caída devuelve 503, nunca 404', async () => {
    // Un 404 le diría a Google que la ficha no existe y la sacaría del índice.
    romperLaBase = true;
    const r = await pedir(ID);
    expect(r.status).toBe(503);
    expect(r.headers.get('Retry-After')).toBe('120');
  });

  it('la empresa gana sobre el particular si el id existiera en las dos tablas', async () => {
    mockEmpresa.mockResolvedValue({ data: { razon_social: 'Forja Atlas' } });
    mockProveedor.mockResolvedValue({ data: { nombre_comercial: 'Otro' } });
    expect(destino(await pedir(ID))).toBe(`${ORIGEN}/empresas/forja-atlas`);
  });
});
