"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Header } from "@/components/plantillas/encabezado";
import { Footer } from "@/components/plantillas/pie-pagina";
import { AuthModal } from "@/modulos/autenticacion/componentes/modal-autenticacion";
import { RecordarSesionGuard } from "@/modulos/autenticacion/componentes/recordar-sesion-guard";

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentUser={currentUser}
        onLogout={logout}
      />
      
      <main className="flex-grow flex flex-col min-h-0">
        {children}
      </main>

      {!isAuthRoute && <Footer />}
      <AuthModal />
      <RecordarSesionGuard />
    </div>
  );
}
