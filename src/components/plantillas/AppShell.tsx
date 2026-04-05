"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Header } from "@/components/plantillas/Header";
import { Footer } from "@/components/plantillas/Footer";
import { AuthModal } from "@/modulos/autenticacion/components/AuthModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();

  // Define paths where Header and Footer should be specialized or hidden
  // We keep them for /register as requested, but might keep them hidden for specialized auth overlays if needed.
  // For now, we restore them generally to avoid the "trapped" feeling.
  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname.startsWith("/recovery");

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentUser={currentUser}
        onLogout={logout}
      />
      
      <main className="flex-grow">
        {children}
      </main>

      <Footer />
      <AuthModal />
    </div>
  );
}
