"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Header } from "@/components/plantillas/encabezado";
import { Footer } from "@/components/plantillas/pie-pagina";
import { AuthModal } from "@/modulos/autenticacion/componentes/modal-autenticacion";
import { RecordarSesionGuard } from "@/modulos/autenticacion/componentes/recordar-sesion-guard";
import { ModalNovedadUsuarios } from "@/modulos/novedades/modal-novedad-usuarios";
import { ModalNovedadPerfil } from "@/modulos/novedades/modal-novedad-perfil";
import { ModalNovedadOportunidades } from "@/modulos/novedades/modal-novedad-oportunidades";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
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
        El Suspense vive acá y no en el layout raíz.

        Cuando envolvía a TODO el AppShell, React difería el body entero: en la
        ficha de una socia salían 14 bloques `<div hidden id="S:n">` y el <h1>
        aparecía recién en el byte 99.357 — después del footer en orden de
        documento. Googlebot resuelve esos chunks, así que no bloqueaba la
        indexación, pero GPTBot, ClaudeBot, PerplexityBot y parte de Bingbot ven
        una página sin texto. Para un directorio que quiere ser descubrible, eso
        es medio canal apagado.

        El único que necesita el boundary es el Header, que usa
        `useSearchParams`. Acotarlo acá deja el contenido de la página dentro
        del primer flush.
      */}
      <Suspense fallback={<div className="h-20 lg:h-24" aria-hidden />}>
        <Header
          currentUser={currentUser}
          onLogout={logout}
        />
      </Suspense>
      
      <main className="flex-grow flex flex-col min-h-0">
        {children}
      </main>

      {!isAuthRoute && <Footer />}
      <AuthModal />
      <RecordarSesionGuard />
      {/* Cartel de novedades: se muestra una vez por socia, en cualquier
          pantalla, porque se entra al sistema por muchas puertas distintas. */}
      <ModalNovedadUsuarios />
      <ModalNovedadPerfil />
      <ModalNovedadOportunidades />
    </div>
  );
}
