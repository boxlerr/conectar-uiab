import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock de @supabase/supabase-js ────────────────────────────────────────────
// Lo mockeamos antes de importar la ruta para que el módulo no intente
// conectarse a Supabase real durante los tests.
const mockUpdateUserById = vi.fn();
const mockPerfilMaybeSingle = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
    // Usado para verificar que el actor es admin (perfiles.rol_sistema)
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockPerfilMaybeSingle,
        })),
      })),
    })),
  })),
}));

// ─── Mock del cliente de sesión (servidor) ────────────────────────────────────
// El endpoint ahora exige un admin autenticado.
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/servidor', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

// ─── Mock de next/server ─────────────────────────────────────────────────────
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      body,
      json: async () => body,
    }),
  },
}));

// Importamos la ruta DESPUÉS de los mocks
import { POST } from '@/app/api/auth/set-role/route';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeRequest(body: object): Request {
  return {
    json: async () => body,
  } as unknown as Request;
}

describe('POST /api/auth/set-role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key';
    // Por defecto: el actor es un admin autenticado.
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    mockPerfilMaybeSingle.mockResolvedValue({ data: { rol_sistema: 'admin' } });
  });

  // ── Autorización ───────────────────────────────────────────────────────────
  it('devuelve 401 si no hay sesión', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await POST(makeRequest({ userId: 'user-123', role: 'admin' }));
    expect(res.status).toBe(401);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('devuelve 403 si el usuario autenticado no es admin', async () => {
    mockPerfilMaybeSingle.mockResolvedValueOnce({ data: { rol_sistema: 'company' } });
    const res = await POST(makeRequest({ userId: 'user-123', role: 'admin' }));
    expect(res.status).toBe(403);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  // ── Validación de entrada ──────────────────────────────────────────────────
  it('devuelve 400 si falta userId', async () => {
    const res = await POST(makeRequest({ role: 'company' }));
    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/parámetros/i);
  });

  it('devuelve 400 si falta role', async () => {
    const res = await POST(makeRequest({ userId: 'user-123' }));
    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/parámetros/i);
  });

  it('devuelve 400 para un rol no permitido', async () => {
    const res = await POST(makeRequest({ userId: 'user-123', role: 'superadmin' }));
    expect(res.status).toBe(400);
    expect((res.body as any).error).toMatch(/rol no válido/i);
  });

  it('devuelve 400 para el rol "guest" (no asignable)', async () => {
    const res = await POST(makeRequest({ userId: 'user-123', role: 'guest' }));
    expect(res.status).toBe(400);
  });

  // ── Roles válidos ──────────────────────────────────────────────────────────
  it.each(['admin', 'company', 'provider'])(
    'acepta el rol válido "%s" y llama a Supabase',
    async (role) => {
      mockUpdateUserById.mockResolvedValueOnce({
        data: { user: { id: 'user-123', app_metadata: { role } } },
        error: null,
      });

      const res = await POST(makeRequest({ userId: 'user-123', role }));

      expect(mockUpdateUserById).toHaveBeenCalledOnce();
      expect(mockUpdateUserById).toHaveBeenCalledWith('user-123', {
        app_metadata: { role },
      });
      expect(res.status).toBe(200);
      expect((res.body as any).message).toMatch(/correctamente/i);
    }
  );

  // ── Errores de Supabase ────────────────────────────────────────────────────
  it('devuelve 500 si Supabase falla al actualizar', async () => {
    mockUpdateUserById.mockResolvedValueOnce({
      data: null,
      error: { message: 'User not found' },
    });

    const res = await POST(makeRequest({ userId: 'user-inexistente', role: 'company' }));
    expect(res.status).toBe(500);
    expect((res.body as any).error).toBe('User not found');
  });

  it('devuelve 500 si falta SUPABASE_SERVICE_ROLE_KEY', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await POST(makeRequest({ userId: 'user-123', role: 'company' }));
    expect(res.status).toBe(500);
    expect((res.body as any).error).toMatch(/SUPABASE_SERVICE_ROLE_KEY/i);
  });
});
