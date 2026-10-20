import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import React from 'react';

/**
 * El layout raíz ya no le pasa el usuario al AuthProvider: leer la sesión ahí
 * volvía dinámicas a todas las rutas. El provider arranca en estado
 * DESCONOCIDO y resuelve en el cliente; las páginas privadas siembran el
 * usuario del servidor con `SemillaUsuario`.
 */

const { auth, mockFrom } = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/cliente', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signOut: vi.fn(),
      getSession: auth.getSession,
      getUser: auth.getUser,
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: mockFrom,
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { AuthProvider, SemillaUsuario, useAuth } from '@/modulos/autenticacion/contexto-autenticacion';
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

/** Query builder que encadena todo y contesta lo que se le diga. */
function builder(data: unknown) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'maybeSingle', 'single']) b[m] = () => b;
  b.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data, error: null }).then(ok);
  return b;
}

function Estado() {
  const { currentUser, loading } = useAuth();
  return <p data-testid="estado">{loading ? 'desconocido' : currentUser ? currentUser.name : 'anonimo'}</p>;
}

async function dejarCorrer() {
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mockFrom.mockImplementation(() => builder(null));
  auth.getSession.mockResolvedValue({ data: { session: null } });
  auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
});

describe('AuthProvider sin usuario del servidor', () => {
  it('el HTML del servidor sale en estado desconocido, igual para todos', () => {
    const html = renderToString(
      <AuthProvider>
        <Estado />
      </AuthProvider>
    );
    expect(html).toContain('desconocido');
  });

  it('sin sesión en las cookies resuelve "anónimo" sin consultar la base', async () => {
    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>
    );
    await dejarCorrer();
    expect(screen.getByTestId('estado').textContent).toBe('anonimo');
    expect(mockFrom).not.toHaveBeenCalled();
    expect(auth.getUser).not.toHaveBeenCalled();
  });

  it('con sesión y copia local del mismo usuario la pinta antes de validar contra Supabase', async () => {
    window.localStorage.setItem('uiab:usuario', JSON.stringify(usuario));
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u-123' } } } });
    // getUser no contesta nunca: lo que se ve tiene que salir de la copia.
    auth.getUser.mockReturnValue(new Promise(() => {}));

    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>
    );
    await dejarCorrer();
    expect(screen.getByTestId('estado').textContent).toBe('Prueba');
    expect(auth.getUser).toHaveBeenCalled();
  });

  it('no usa la copia local de OTRO usuario', async () => {
    window.localStorage.setItem('uiab:usuario', JSON.stringify({ ...usuario, id: 'otro' }));
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u-123' } } } });
    auth.getUser.mockReturnValue(new Promise(() => {}));

    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>
    );
    await dejarCorrer();
    expect(screen.getByTestId('estado').textContent).not.toBe('Prueba');
  });

  it('sin copia lee el perfil con la sesión de las cookies, sin esperar a getUser()', async () => {
    // getUser retiene el lock de auth-js mientras va a la red: esperarlo antes
    // del perfil eran 4 viajes en serie para pintar el header.
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u-123', email: 'prueba@ejemplo.com' } } } });
    auth.getUser.mockReturnValue(new Promise(() => {}));
    mockFrom.mockImplementation(() =>
      builder({ id: 'u-123', nombre_completo: 'Desde la base', rol_sistema: 'company', activo: true })
    );

    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>
    );
    await dejarCorrer();
    expect(screen.getByTestId('estado').textContent).toBe('Desde la base');
    expect(auth.getUser).not.toHaveBeenCalled();
  });

  it('al quedar anónimo borra la copia local', async () => {
    window.localStorage.setItem('uiab:usuario', JSON.stringify(usuario));
    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>
    );
    await dejarCorrer();
    expect(window.localStorage.getItem('uiab:usuario')).toBeNull();
  });
});

describe('SemillaUsuario (páginas privadas)', () => {
  it('el HTML del servidor de la página privada ya sale con el usuario', () => {
    const html = renderToString(
      <AuthProvider>
        <SemillaUsuario usuario={usuario}>
          <Estado />
        </SemillaUsuario>
      </AuthProvider>
    );
    expect(html).toContain('Prueba');
  });

  it('el provider la adopta (el header la ve) y no resuelve por su cuenta', async () => {
    render(
      <AuthProvider>
        <div data-testid="fuera"><Estado /></div>
        <SemillaUsuario usuario={usuario}>
          <Estado />
        </SemillaUsuario>
      </AuthProvider>
    );
    await dejarCorrer();
    expect(screen.getByTestId('fuera').textContent).toBe('Prueba');
    expect(auth.getSession).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('una semilla en null no siembra: decide el provider', async () => {
    render(
      <AuthProvider>
        <SemillaUsuario usuario={null}>
          <Estado />
        </SemillaUsuario>
      </AuthProvider>
    );
    await dejarCorrer();
    expect(auth.getSession).toHaveBeenCalled();
    expect(screen.getByTestId('estado').textContent).toBe('anonimo');
  });
});
