import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

/**
 * Regresión del bug histórico "queda cargando en loop hasta que aprieto F5".
 *
 *   CAUSA RAÍZ: las queries del cliente Supabase NUNCA rechazan (devuelven
 *   `{ data, error }`) y encima tienen timeout de 15s. Los Server Actions son lo
 *   contrario: su promesa RECHAZA cuando falla el transporte, y no pasan por ese
 *   fetch, así que nada los cubría. Un `await accion()` sin try/catch cortaba la
 *   función y el `setCargando(false)` de la línea siguiente no corría nunca.
 *
 *   DISPARADOR HABITUAL: deploy skew. Tras un deploy, las pestañas abiertas
 *   siguen con el bundle viejo y mandan un `Next-Action` id que ya no existe en
 *   el build nuevo. Por eso F5 lo arreglaba (baja el bundle nuevo) y navegar con
 *   <Link> no (la navegación client-side NO recarga el JS).
 *
 *   FIX: `llamarAccion()` en src/lib/accion-segura.ts — nunca rechaza, siempre
 *   resuelve a `{ error }`, de modo que el camino de error que ya tenía cada
 *   componente corre y el spinner se apaga.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockListar } = vi.hoisted(() => ({ mockListar: vi.fn() }));

vi.mock('@/app/perfil/usuarios/acciones', () => ({
  listarUsuariosDeLaFicha: mockListar,
  crearUsuarioDeLaFicha: vi.fn(),
  cambiarEstadoUsuarioDeLaFicha: vi.fn(),
  cambiarPasswordUsuarioDeLaFicha: vi.fn(),
}));

vi.mock('@/modulos/autenticacion/contexto-autenticacion', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'u-1',
      name: 'Socia',
      email: 'socia@uiab.test',
      role: 'company',
      isMember: true,
      entityId: 'emp-1',
      entityRole: 'company',
      subscriptionEstado: 'activa',
    },
    loading: false,
  }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { llamarAccion, fallo, ERROR_TRANSPORTE_ACCION } from '@/lib/accion-segura';
import UsuariosDeLaFichaPage from '@/app/perfil/usuarios/page';

// ─── La unidad que sostiene todo el fix ───────────────────────────────────────

describe('llamarAccion — un Server Action nunca puede tumbar la UI', () => {
  it('convierte el RECHAZO del transporte en { error } en vez de propagarlo', async () => {
    const res = await llamarAccion(async () => {
      // Lo que tira el runtime de Next cuando el action id ya no existe.
      throw new TypeError('Failed to fetch');
    });

    expect(fallo(res)).toBe(true);
    expect((res as { error: string }).error).toBe(ERROR_TRANSPORTE_ACCION);
  });

  it('no rechaza NUNCA, aunque el action tire algo que no es Error', async () => {
    await expect(llamarAccion(async () => { throw 'string pelado'; })).resolves.toBeTruthy();
    await expect(llamarAccion(async () => { throw null; })).resolves.toBeTruthy();
  });

  it('deja pasar el resultado exitoso intacto', async () => {
    const res = await llamarAccion(async () => ({ usuarios: [{ id: 'x' }] }));
    expect(fallo(res)).toBe(false);
    expect(res).toEqual({ usuarios: [{ id: 'x' }] });
  });

  it('trata como fallo también el { error } que devuelve el propio action', () => {
    expect(fallo({ error: 'No tenés permiso' })).toBe(true);
    expect(fallo({ usuarios: [] })).toBe(false);
    expect(fallo(null)).toBe(false);
    expect(fallo({ error: 123 })).toBe(false); // error no-string: no es la forma esperada
  });
});

// ─── El caso real que el usuario veía: /perfil/usuarios ───────────────────────

describe('/perfil/usuarios — el spinner se apaga aunque el Server Action falle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('con deploy skew (la promesa RECHAZA) muestra el error, NO un spinner eterno', async () => {
    mockListar.mockRejectedValue(new TypeError('Failed to fetch'));

    const { container } = render(<UsuariosDeLaFichaPage />);

    // Antes del fix esto no pasaba nunca: `cargando` arrancaba en true y el
    // único setCargando(false) vivía después del await que rechazaba.
    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeNull();
    });

    expect(await screen.findByText(ERROR_TRANSPORTE_ACCION)).toBeInTheDocument();
  });

  it('con un error de negocio del action también apaga el spinner', async () => {
    mockListar.mockResolvedValue({ error: 'No tenés permiso sobre esta ficha' });

    const { container } = render(<UsuariosDeLaFichaPage />);

    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeNull();
    });
    expect(
      await screen.findByText('No tenés permiso sobre esta ficha')
    ).toBeInTheDocument();
  });

  it('en el camino feliz renderiza los usuarios', async () => {
    mockListar.mockResolvedValue({
      usuarios: [
        {
          perfilId: 'p-1',
          nombre: 'Evelyn G.',
          email: 'compras@empresa.test',
          cargo: 'Compras',
          activo: true,
          esPrincipal: false,
        },
      ],
    });

    const { container } = render(<UsuariosDeLaFichaPage />);

    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeNull();
    });
    expect(await screen.findByText('Evelyn G.')).toBeInTheDocument();
  });
});
