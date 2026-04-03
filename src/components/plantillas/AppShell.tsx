"use client";

import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Header } from "@/components/plantillas/Header";
import { Footer } from "@/components/plantillas/Footer";
import { AuthModal } from "@/modulos/autenticacion/components/AuthModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();

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
