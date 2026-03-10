"use client";

import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Header } from "@/components/plantillas/Header";
import { AuthModal } from "@/modulos/autenticacion/components/AuthModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, openAuthModal, logout } = useAuth();

  return (
    <>
      <Header
        currentUser={currentUser}
        onLoginClick={openAuthModal}
        onLogout={logout}
      />
      {children}
      <AuthModal />
    </>
  );
}
