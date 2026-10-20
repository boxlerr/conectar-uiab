import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';

/**
 * Volver a la pestaña no puede re-renderizar la app entera.
 *
 * auth-js emite SIGNED_IN en cada `visibilitychange`. Hasta el 2026-10-20 el
 * provider respondía con tres queries en serie desde el browser y un
 * `setCurrentUser` con un objeto nuevo: medido en el panel, 191 componentes
 * re-renderizados y 4 pedidos a Supabase por cada vuelta a la pestaña.
 */

type CallbackAuth = (evento: string, sesion: unknown) => void;

const { estado, mockFrom } = vi.hoisted(() => ({
  estado: { callback: null as CallbackAuth | null },
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/cliente', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signOut: vi.fn(),
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn((cb: CallbackAuth) => {
        estado.callback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    from: mockFrom,
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { AuthProvider, useAuth } from '@/modulos/autenticacion/contexto-autenticacion';
import type { User } from '@/tipos';

const usuario: User = {
  id: 'u-123',
  name: 'Prueba',
  email: 'prueba@ejemplo.com',
  role: 'company' as User['role'],
  isMember: true,
  entityId: 'emp-1',
  subscriptionEstado: 'activa',
};

/** Query builder que encadena todo y contesta vacío. */
function builderVacio() {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'maybeSingle', 'single']) b[m] = () => b;
  b.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null }).then(ok);
  return b;
}

let renders = 0;
function Consumidor() {
  useAuth();
  renders++;
  return null;
}

async function emitir(evento: string, sesion: unknown) {
  await act(async () => {
    estado.callback?.(evento, sesion);
    // El provider difiere el trabajo con setTimeout(0) para no trabarse en el
    // lock de auth-js: hay que dejar correr ese timer y las promesas.
    await new Promise((r) => setTimeout(r, 20));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockImplementation(() => builderVacio());
  renders = 0;
});

describe('AuthProvider: SIGNED_IN del mismo usuario', () => {
  it('no vuelve a consultar Supabase ni re-renderiza a los consumidores', async () => {
    render(
      <AuthProvider initialUser={usuario}>
        <Consumidor />
      </AuthProvider>
    );
    const rendersIniciales = renders;

    await emitir('SIGNED_IN', { user: { id: 'u-123', email: 'prueba@ejemplo.com' } });
    await emitir('SIGNED_IN', { user: { id: 'u-123', email: 'prueba@ejemplo.com' } });

    expect(mockFrom).not.toHaveBeenCalled();
    expect(renders).toBe(rendersIniciales);
  });

  it('si entra OTRO usuario sí lee su perfil', async () => {
    render(
      <AuthProvider initialUser={usuario}>
        <Consumidor />
      </AuthProvider>
    );

    await emitir('SIGNED_IN', { user: { id: 'otro-usuario', email: 'otro@ejemplo.com' } });

    expect(mockFrom).toHaveBeenCalledWith('perfiles');
  });

  it('TOKEN_REFRESHED sigue refrescando el perfil (cada ~50 min)', async () => {
    render(
      <AuthProvider initialUser={usuario}>
        <Consumidor />
      </AuthProvider>
    );

    await emitir('TOKEN_REFRESHED', { user: { id: 'u-123', email: 'prueba@ejemplo.com' } });

    expect(mockFrom).toHaveBeenCalledWith('perfiles');
  });
});
