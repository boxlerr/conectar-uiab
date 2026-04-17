import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests del route handler /api/auth/logout.
 *
 * Reproduce el bug raíz:
 *   "El logout finge cerrar sesión pero no cierra" —
 *   con @supabase/ssr las cookies sb-* son httpOnly y SOLO el servidor
 *   puede borrarlas. Si el logout solo corre en el browser, las cookies
 *   quedan y el middleware sigue viendo sesión válida.
 *
 * Este endpoint debe:
 *   1. Llamar a supabase.auth.signOut() en el cliente de servidor
 *   2. Borrar explícitamente cada cookie sb-* de la respuesta (defensa en profundidad)
 */

const { mockSignOut, mockGetAll, responseCookiesSet } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockGetAll: vi.fn(),
  responseCookiesSet: vi.fn(),
}));

vi.mock('@/lib/supabase/servidor', () => ({
  createClient: vi.fn(async () => ({
    auth: { signOut: mockSignOut },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ getAll: mockGetAll })),
}));

vi.mock('next/server', () => {
  class MockResponse {
    cookies = { set: responseCookiesSet };
    static json(body: any, init?: any) {
      const r = new MockResponse();
      (r as any).body = body;
      (r as any).init = init;
      return r;
    }
  }
  return { NextResponse: MockResponse };
});

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama a supabase.auth.signOut con scope global (limpia todas las sesiones)', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    mockGetAll.mockReturnValue([]);

    await POST();

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('borra EXPLÍCITAMENTE todas las cookies que empiezan con "sb-"', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    // Simulamos el estado real: auth token dividido en chunks y otras cookies.
    mockGetAll.mockReturnValue([
      { name: 'sb-abcdefg-auth-token.0', value: 'eyJ...chunk0' },
      { name: 'sb-abcdefg-auth-token.1', value: 'eyJ...chunk1' },
      { name: 'sb-abcdefg-auth-token-code-verifier', value: 'verify...' },
      { name: 'session-id', value: 'otra' }, // NO debe tocarse
      { name: 'theme', value: 'dark' },       // NO debe tocarse
    ]);

    await POST();

    // Las 3 cookies sb-* deben haberse expirado
    expect(responseCookiesSet).toHaveBeenCalledWith('sb-abcdefg-auth-token.0', '', { maxAge: 0, path: '/' });
    expect(responseCookiesSet).toHaveBeenCalledWith('sb-abcdefg-auth-token.1', '', { maxAge: 0, path: '/' });
    expect(responseCookiesSet).toHaveBeenCalledWith('sb-abcdefg-auth-token-code-verifier', '', { maxAge: 0, path: '/' });
    // Las otras NO
    expect(responseCookiesSet).not.toHaveBeenCalledWith('session-id', expect.anything(), expect.anything());
    expect(responseCookiesSet).not.toHaveBeenCalledWith('theme', expect.anything(), expect.anything());
  });

  it('si signOut falla, IGUAL borra las cookies (defensa en profundidad)', async () => {
    // Reproduce: refresh token revocado o Supabase no accesible.
    mockSignOut.mockResolvedValue({ error: { message: 'refresh_token_not_found' } });
    mockGetAll.mockReturnValue([
      { name: 'sb-xxx-auth-token', value: 'bad' },
    ]);

    await POST();

    // Crítico: aunque el signOut remoto falle, borramos la cookie igual.
    // Si no hiciéramos esto, el usuario quedaría "logeado" con cookie zombie.
    expect(responseCookiesSet).toHaveBeenCalledWith('sb-xxx-auth-token', '', { maxAge: 0, path: '/' });
  });

  it('si el cliente servidor tira excepción, responde 200 (no bloquea al user)', async () => {
    const { createClient } = await import('@/lib/supabase/servidor');
    vi.mocked(createClient).mockRejectedValueOnce(new Error('DB unreachable'));

    // No debe lanzar. Debe responder normalmente.
    await expect(POST()).resolves.toBeDefined();
  });
});
