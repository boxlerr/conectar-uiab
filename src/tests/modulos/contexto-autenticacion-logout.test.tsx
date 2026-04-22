import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

/**
 * Verifica los fixes contra el bug "el logout finge cerrar pero no cierra sesión":
 *
 *   CAUSA RAÍZ: con @supabase/ssr la sesión vive en cookies httpOnly que
 *   SOLO el servidor puede borrar. `supabase.auth.signOut({ scope: 'local' })`
 *   desde el browser solo limpia localStorage (vacío). Las cookies quedaban
 *   intactas y el middleware seguía viendo sesión válida → reLoggeo inmediato.
 *
 *   FIX: llamar a POST /api/auth/logout (route handler server-side) que usa
 *   el cliente Supabase de servidor para borrar las cookies sb-* y además
 *   las expira explícitamente con maxAge: 0.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
const { mockSignOut, mockGetUser, mockOnAuthStateChange, mockFrom } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockGetUser: vi.fn(),
  mockOnAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/cliente', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { AuthProvider, useAuth } from '@/modulos/autenticacion/contexto-autenticacion';
import type { User } from '@/tipos';

const usuarioFalso: User = {
  id: 'u-123',
  name: 'Prueba',
  email: 'prueba@uiab.com',
  role: 'company' as any,
  isMember: true,
  entityId: 'emp-1',
  subscriptionEstado: 'activa',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider initialUser={usuarioFalso}>{children}</AuthProvider>;
}

describe('AuthContext — logout server-side (fix bug "Saliendo..." sin efecto)', () => {
  let originalLocation: Location;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock de window.location para poder verificar el redirect sin que
    // jsdom realmente navegue.
    originalLocation = window.location;
    // @ts-expect-error: override para test
    delete window.location;
    // @ts-expect-error: stub mínimo de Location
    window.location = { href: '', reload: vi.fn() };

    // Mock global fetch. En jsdom URLs relativas fallan sin un host.
    fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      } as Response)
    );
    global.fetch = fetchMock as any;

    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    // @ts-expect-error: restaurar
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  it('llama al endpoint server-side POST /api/auth/logout (no solo signOut browser)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      })
    );
  });

  it('limpia currentUser INMEDIATAMENTE antes de que el fetch responda', async () => {
    // Fetch que tarda 2s
    fetchMock.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ ok: true, status: 200 } as Response), 2000);
    }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.currentUser).not.toBeNull();

    act(() => { void result.current.logout(); });

    // Sin esperar: el usuario local ya debe estar limpio al instante.
    expect(result.current.currentUser).toBeNull();
  });

  it('redirige con hard reload (window.location.href = "/") — no router.push', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(window.location.href).toBe('/');
  });

  it('completa el logout aunque el fetch cuelgue (timeout de 4s via AbortController)', async () => {
    // Fetch que nunca resuelve: simula red caída.
    fetchMock.mockImplementationOnce((_url, opts: any) => {
      return new Promise((_, reject) => {
        opts.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    vi.useFakeTimers();

    const { result } = renderHook(() => useAuth(), { wrapper });

    let logoutPromise: Promise<void>;
    act(() => {
      logoutPromise = result.current.logout();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    // El logout debe haberse resuelto y redirigido.
    await expect(logoutPromise!).resolves.toBeUndefined();
    expect(window.location.href).toBe('/');

    vi.useRealTimers();
  });

  it('si el endpoint responde con error, igual redirige (no bloquea al usuario)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.currentUser).toBeNull();
    expect(window.location.href).toBe('/');
  });

  it('clicks repetidos en logout no disparan múltiples fetch (isLoggingOut guard)', async () => {
    // Respuesta rápida para que el 1er logout complete.
    fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // El guard isLoggingOut solo funciona DENTRO del mismo tick — una vez
    // completado el primer logout, isLoggingOut se queda en true e ignora
    // clicks subsecuentes. Lanzamos 3 llamadas en paralelo:
    await act(async () => {
      await Promise.all([
        result.current.logout(),
        result.current.logout(),
        result.current.logout(),
      ]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
