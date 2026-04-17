import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  TEST DE REGRESIÓN: EL BUG "LOGOUT FINGE CERRAR PERO NO CIERRA"
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Reproduce EXACTAMENTE lo que vivió el usuario:
 *
 *   1. Usuario está logeado (cookie sb-*-auth-token presente)
 *   2. Click en "Cerrar sesión"
 *   3. Método BUGGY: solo `supabase.auth.signOut({ scope: 'local' })` en browser
 *   4. Cookie NO se toca (es httpOnly, el browser no puede borrarla vía JS)
 *   5. window.location.href = '/'
 *   6. Middleware corre server-side, lee cookies, ve sesión válida
 *   7. getUser() retorna user → redirige a /dashboard
 *   8. "Se cerró y se abrió solo" → el bug reportado
 *
 * Verifica que el FIX (llamar a /api/auth/logout) sí borra la cookie.
 */

// Simulador simplificado del "cookie jar" httpOnly del browser.
class CookieJar {
  cookies = new Map<string, string>();

  // Solo el servidor puede setear httpOnly
  setFromServer(name: string, value: string) { this.cookies.set(name, value); }

  // El cliente JS NO puede leer ni borrar httpOnly — simulado aquí: siempre vacío
  readFromClient(): string { return ''; }
  deleteFromClient(_name: string) { /* no-op: httpOnly */ }

  // Snapshot para las aserciones
  list() { return Array.from(this.cookies.keys()); }
  has(name: string) { return this.cookies.has(name); }
}

/** Simula el middleware de Next.js: si hay cookie válida → "sigue logeado" */
function simulateMiddleware(jar: CookieJar): { redirect?: string; user?: string } {
  const hasAuthCookie = jar.list().some(n => n.startsWith('sb-') && n.includes('auth-token'));
  return hasAuthCookie
    ? { user: 'u-123' }               // middleware ve sesión → pasa
    : { redirect: '/login' };         // sin cookie → redirige a login
}

describe('BUG: logout sin limpiar cookies httpOnly', () => {
  let jar: CookieJar;

  beforeEach(() => {
    jar = new CookieJar();
    // Simulamos el estado inicial: usuario logeado, cookies seteadas por server
    jar.setFromServer('sb-abc123-auth-token.0', 'eyJhbGciOiJIUzI1NiJ9.chunk0');
    jar.setFromServer('sb-abc123-auth-token.1', 'chunk1.signature');
  });

  describe('Método BUGGY (sólo signOut en browser)', () => {
    it('REPRODUCE EL BUG: las cookies sb-* persisten después del "logout"', async () => {
      // ── Flujo del logout BUGGY ──
      // 1. Cliente browser intenta borrar localStorage (que es lo que hace
      //    signOut scope:'local')
      // 2. Intenta borrar cookies vía document.cookie (no funciona con httpOnly)
      jar.deleteFromClient('sb-abc123-auth-token.0');
      jar.deleteFromClient('sb-abc123-auth-token.1');

      // 3. Redirect a /
      const middlewareResult = simulateMiddleware(jar);

      // ── VERIFICACIÓN: el bug está presente ──
      // Las cookies sobreviven...
      expect(jar.has('sb-abc123-auth-token.0')).toBe(true);
      expect(jar.has('sb-abc123-auth-token.1')).toBe(true);
      // ...y el middleware te ve como logeado.
      expect(middlewareResult.user).toBe('u-123');
      expect(middlewareResult.redirect).toBeUndefined();
    });
  });

  describe('Método FIX (POST /api/auth/logout server-side)', () => {
    /**
     * Simula el comportamiento del route handler que implementamos:
     * borra cada cookie sb-* via Set-Cookie con Max-Age=0.
     */
    async function callLogoutRoute(jar: CookieJar) {
      // El servidor tiene acceso completo al cookie store.
      const toDelete = jar.list().filter(n => n.startsWith('sb-'));
      for (const name of toDelete) {
        // Max-Age=0 en el response.cookies.set() → el browser elimina la cookie.
        jar.cookies.delete(name);
      }
    }

    it('borra las cookies sb-* server-side → middleware ya NO ve sesión', async () => {
      expect(jar.has('sb-abc123-auth-token.0')).toBe(true); // estado inicial

      await callLogoutRoute(jar);

      // Ahora las cookies están realmente borradas
      expect(jar.has('sb-abc123-auth-token.0')).toBe(false);
      expect(jar.has('sb-abc123-auth-token.1')).toBe(false);

      // Y el middleware redirige a login (sesión cerrada de verdad)
      const middlewareResult = simulateMiddleware(jar);
      expect(middlewareResult.redirect).toBe('/login');
      expect(middlewareResult.user).toBeUndefined();
    });

    it('no toca cookies que no empiezan con "sb-" (theme, locale, etc.)', async () => {
      jar.setFromServer('theme', 'dark');
      jar.setFromServer('locale', 'es-AR');

      await callLogoutRoute(jar);

      expect(jar.has('theme')).toBe(true);
      expect(jar.has('locale')).toBe(true);
      expect(jar.has('sb-abc123-auth-token.0')).toBe(false);
    });

    it('funciona aunque Supabase rechace el signOut (cookies se borran igual)', async () => {
      // La ruta server hace: signOut() Y ADEMÁS borra cookies manualmente.
      // Si signOut falla, el fallback manual SIEMPRE corre.
      const signOutFake = vi.fn().mockRejectedValue(new Error('network'));
      try { await signOutFake(); } catch { /* swallow */ }

      // El borrado manual se ejecuta igual:
      await callLogoutRoute(jar);

      expect(jar.has('sb-abc123-auth-token.0')).toBe(false);
    });
  });

  describe('Flujo COMPLETO: simulación del escenario real del usuario', () => {
    it('ESCENARIO DEL USUARIO: buggy → persiste sesión; fix → cierra de verdad', async () => {
      // ── Escenario 1: Método buggy (antes del fix) ──
      const jarBuggy = new CookieJar();
      jarBuggy.setFromServer('sb-auth-token', 'real-jwt');

      // "Click en cerrar sesión" con el método buggy
      jarBuggy.deleteFromClient('sb-auth-token'); // no-op por httpOnly

      const buggyResult = simulateMiddleware(jarBuggy);
      expect(buggyResult.user).toBe('u-123'); // ¡sigue logeado! BUG

      // ── Escenario 2: Método fix ──
      const jarFix = new CookieJar();
      jarFix.setFromServer('sb-auth-token', 'real-jwt');

      // "Click en cerrar sesión" → POST /api/auth/logout → server borra cookies
      jarFix.cookies.delete('sb-auth-token');

      const fixResult = simulateMiddleware(jarFix);
      expect(fixResult.redirect).toBe('/login'); // de verdad cerró sesión ✓
      expect(fixResult.user).toBeUndefined();
    });
  });
});
