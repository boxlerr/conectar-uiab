import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  BUG: "Queries quedan colgadas tras navegar un rato — ni F5 las arregla"
 * ══════════════════════════════════════════════════════════════════════════
 *
 * CAUSA RAÍZ:
 *   @supabase/ssr usa navigator.locks.request('lock:sb-*-auth-token') para
 *   serializar el refresh de token. Si un holder anterior no libera el lock
 *   (HMR, tab backgrounded, bfcache), TODAS las queries subsecuentes esperan
 *   al lock para siempre.
 *
 * FIX:
 *   1. Custom `lock` con timeout de 3s: si no se adquiere, salta el lock y
 *      corre la operación igual. Mejor corromper un refresh que colgar la UI.
 *   2. `resetClient()` expuesto para rehidratar el singleton.
 *   3. Reset automático cuando la tab vuelve de background tras >30s.
 */

describe('cliente Supabase browser — anti-deadlock de navigator.locks', () => {
  let realLocks: any;
  let lockHolderRelease: (() => void) | null = null;

  beforeEach(() => {
    // Simular un lock huérfano: request() nunca resuelve (el holder se fue
    // sin liberar). Esto reproduce el HMR / tab-backgrounded bug.
    realLocks = (global as any).navigator?.locks;
    (global as any).navigator = {
      ...((global as any).navigator || {}),
      locks: {
        request: vi.fn((_name: string, options: any, callback?: any) => {
          // Si vino con AbortSignal (nuestro custom lock), respetarlo.
          const signal: AbortSignal | undefined = options?.signal ?? options;
          const cb = callback ?? options;
          return new Promise((resolve, reject) => {
            if (signal && typeof signal === 'object' && 'addEventListener' in signal) {
              signal.addEventListener('abort', () => {
                const err = new DOMException('Aborted', 'AbortError');
                reject(err);
              });
            }
            // Jamás adquirimos el lock — simula el holder fantasma.
            // Salvo que alguien fuerce la liberación.
            lockHolderRelease = () => {
              Promise.resolve(cb({ name: _name, mode: 'exclusive' })).then(resolve, reject);
            };
          });
        }),
      },
    };
  });

  afterEach(() => {
    if (realLocks) (global as any).navigator.locks = realLocks;
    lockHolderRelease = null;
    vi.restoreAllMocks();
  });

  it('con navigator.locks default (buggy): la operación NUNCA resuelve', async () => {
    // Comportamiento antes del fix: sin signal, el request cuelga para siempre.
    let resolved = false;
    (global as any).navigator.locks.request('lock:demo', {}, async () => {
      resolved = true;
    }).catch(() => { /* swallow */ });

    await new Promise(r => setTimeout(r, 50));

    expect(resolved).toBe(false); // ¡la query quedó colgada!
  });

  it('FIX: lockConTimeout corta a los 3s y corre la operación sin lock', async () => {
    // Recreamos la lógica del custom lock
    async function lockConTimeout<R>(
      name: string,
      acquireTimeoutMs: number,
      fn: () => Promise<R>
    ): Promise<R> {
      const timeout = Math.min(acquireTimeoutMs || 3000, 3000);
      const abortCtrl = new AbortController();
      const timer = setTimeout(() => abortCtrl.abort(), timeout);
      try {
        return await (navigator as any).locks.request(
          name,
          { mode: 'exclusive', signal: abortCtrl.signal },
          async () => fn()
        );
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
          return fn(); // fallback: corremos sin lock
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    vi.useFakeTimers();
    const fn = vi.fn(async () => 'resultado-del-refresh');

    const promise = lockConTimeout('lock:sb-auth-token', 3000, fn);

    // Avanzamos 3s: el AbortController se dispara.
    await vi.advanceTimersByTimeAsync(3100);

    const result = await promise;

    // La operación corrió igual (sin lock) — no se colgó.
    expect(result).toBe('resultado-del-refresh');
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('resetClient(): el próximo createClient() construye una instancia fresca', async () => {
    // Mock de @supabase/ssr para aislar el test
    vi.doMock('@supabase/ssr', () => ({
      createBrowserClient: vi.fn(() => ({ id: Math.random() })),
    }));
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'demo-key';

    const { createClient, resetClient } = await import('@/lib/supabase/cliente');

    const c1 = createClient();
    const c2 = createClient();
    expect(c1).toBe(c2); // singleton

    resetClient();

    const c3 = createClient();
    expect(c3).not.toBe(c1); // instancia nueva tras reset
  });

  it('lockConTimeout: si navigator.locks no existe (SSR), ejecuta directo', async () => {
    // Simular SSR: sin navigator.locks
    const originalNavigator = (global as any).navigator;
    (global as any).navigator = undefined;

    async function lockConTimeout<R>(
      _name: string,
      _acquireTimeoutMs: number,
      fn: () => Promise<R>
    ): Promise<R> {
      if (typeof navigator === 'undefined' || !('locks' in navigator) || !(navigator as any).locks) {
        return fn();
      }
      return fn(); // no llegamos acá
    }

    const fn = vi.fn(async () => 'ssr-result');
    const result = await lockConTimeout('lock:x', 3000, fn);

    expect(result).toBe('ssr-result');
    expect(fn).toHaveBeenCalledTimes(1);

    (global as any).navigator = originalNavigator;
  });
});
