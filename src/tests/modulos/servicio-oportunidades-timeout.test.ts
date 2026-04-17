import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Verifica que los fixes contra "páginas colgadas en loading" funcionan:
 *
 *   BUG ORIGINAL: al dejar la tab abierta mucho tiempo, Supabase queda con
 *   token expirado en memoria. Las queries quedaban pendientes indefinidamente
 *   (sin timeout) y las páginas se mostraban en skeleton para siempre.
 *
 *   FIX: envolvimos cada query en race(..., 10000). Si Supabase no responde
 *   en 10s, la promesa rechaza con "Supabase query timeout" y la UI puede
 *   mostrar error en vez de skeleton eterno.
 */

const { mockSingle, mockOrder, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockOrder = vi.fn(() => ({ single: mockSingle }));
  const mockEq = vi.fn(() => ({ order: mockOrder, single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder, single: mockSingle }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockSingle, mockOrder, mockEq, mockSelect, mockFrom };
});

vi.mock('@/lib/supabase/cliente', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { oportunidadesService } from '@/modulos/oportunidades/servicio-oportunidades';

describe('oportunidadesService — timeout (fix bug loading infinito)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOrder.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getOportunidades() rechaza con "Supabase query timeout" si la query cuelga >10s', async () => {
    // Simulamos una query que NUNCA resuelve (esto era lo que pasaba cuando
    // el JWT estaba vencido: el cliente quedaba esperando eternamente).
    mockOrder.mockReturnValueOnce(new Promise(() => { /* hangs forever */ }));

    const resultPromise = oportunidadesService.getOportunidades();
    // Adjuntamos un catch silencioso para evitar PromiseRejectionHandledWarning
    // mientras los fake timers aún no avanzaron. El assert real va abajo.
    resultPromise.catch(() => {});

    // Avanzamos el tiempo fake 10 segundos — el timeout debe dispararse.
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(resultPromise).rejects.toThrow('Supabase query timeout');
  });

  it('getOportunidades() NO rechaza antes de 10s (no hay falsos positivos)', async () => {
    mockOrder.mockReturnValueOnce(new Promise(() => {}));

    const resultPromise = oportunidadesService.getOportunidades();
    let settled = false;
    resultPromise.then(() => (settled = true), () => (settled = true));

    // A los 9.9s todavía no debe haberse resuelto
    await vi.advanceTimersByTimeAsync(9_900);
    expect(settled).toBe(false);

    // Limpieza: avanzamos hasta gatillar el timeout para que no quede "pendiente"
    await vi.advanceTimersByTimeAsync(200);
    await expect(resultPromise).rejects.toThrow('Supabase query timeout');
  });

  it('getMatchesForUser() también respeta el timeout', async () => {
    mockOrder.mockReturnValueOnce(new Promise(() => {}));

    const resultPromise = oportunidadesService.getMatchesForUser('prov-1', 'provider');
    resultPromise.catch(() => {});

    await vi.advanceTimersByTimeAsync(10_000);
    await expect(resultPromise).rejects.toThrow('Supabase query timeout');
  });

  it('getOportunidadById() rechaza en timeout cuando el single() cuelga', async () => {
    mockSingle.mockReturnValueOnce(new Promise(() => {}));

    const resultPromise = oportunidadesService.getOportunidadById('op-001');
    resultPromise.catch(() => {});

    await vi.advanceTimersByTimeAsync(10_000);
    await expect(resultPromise).rejects.toThrow('Supabase query timeout');
  });

  it('si la query responde rápido, el timeout no se dispara (flujo normal)', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const resultado = await oportunidadesService.getOportunidades();
    expect(resultado).toEqual([]);
    // Avanzar el tiempo después no debe causar ningún error.
    await vi.advanceTimersByTimeAsync(20_000);
  });

  it('createClient() se invoca en cada llamada (no singleton module-scope)', async () => {
    // ANTES del fix, el cliente se creaba una sola vez en module scope.
    // AHORA se crea por llamada → cada query usa el token más fresco disponible.
    const cliente = await import('@/lib/supabase/cliente');
    const spy = vi.mocked(cliente.createClient);

    mockOrder.mockResolvedValue({ data: [], error: null });

    spy.mockClear();
    await oportunidadesService.getOportunidades();
    await oportunidadesService.getOportunidades();
    await oportunidadesService.getMatchesForUser('u', 'provider');

    expect(spy).toHaveBeenCalledTimes(3);
  });
});
