"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Header } from "@/components/plantillas/encabezado";
import { Footer } from "@/components/plantillas/pie-pagina";
import { AuthModal } from "@/modulos/autenticacion/componentes/modal-autenticacion";
import { RecordarSesionGuard } from "@/modulos/autenticacion/componentes/recordar-sesion-guard";
import { PilaNovedades } from "@/modulos/novedades/pila-novedades";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, logout } = useAuth();
  const pathname = usePathname();

  // Define paths where Header and Footer should be specialized or hidden
  // We keep them for /register as requested, but might keep them hidden for specialized auth overlays if needed.
  // For now, we restore them generally to avoid the "trapped" feeling.
  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname.startsWith("/recovery");

  // Rutas de auth a pantalla completa: son experiencias enfocadas (llegás por un
  // link de correo con un token) donde el nav global sólo estorba — empuja el
  // formulario fuera de pantalla y obliga a scrollear. Estas páginas ya traen su
  // propia identidad de marca (panel lateral), así que van sin Header ni Footer.
  const isFullscreenAuth =
    pathname === "/recovery" ||
    pathname === "/restablecer-password";

  if (isFullscreenAuth) {
    return (
      <>
        {children}
        <RecordarSesionGuard />
      </>
    );
  }

  // svh y no vh/dvh: en iOS el 100vh incluye la barra de Safari (el contenido
  // sale cortado) y el dvh reflowea sin parar mientras la barra entra y sale.
  return (
    <div className="flex flex-col min-h-svh">
      {/*
        Sin Suspense alrededor del Header, y que siga así.

        Cuando un boundary envolvía a TODO el AppShell, React difería el body
        entero: en la ficha de una socia salían 14 bloques `<div hidden id="S:n">`
        y el <h1> aparecía recién en el byte 99.357 — después del footer en orden
        de documento. Googlebot resuelve esos chunks, pero GPTBot, ClaudeBot,
        PerplexityBot y parte de Bingbot ven una página sin texto.

        Después quedó uno acotado al Header, porque usaba `useSearchParams`. En
        una página ESTÁTICA eso ya no sirve: el prerender corta en el boundary y
        el HTML sale con el fallback, o sea sin el nav. El query ahora lo lee un
        componente chiquito adentro del Header, con su propio boundary.
      */}
      <Header
        currentUser={currentUser}
        sesionDesconocida={loading && !currentUser}
        onLogout={logout}
      />
      
      <main className="flex-grow flex flex-col min-h-0">
        {children}
      </main>

      {!isAuthRoute && <Footer />}
      <AuthModal />
      <RecordarSesionGuard />
      {/* Carteles de novedades: se muestran una vez por socia, en cualquier
          pantalla, porque se entra al sistema por muchas puertas distintas. Si
          hay varios pendientes se recorren de a uno con Siguiente / Atrás. */}
      <PilaNovedades />
    </div>
  );
}
