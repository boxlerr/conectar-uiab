"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { AuthModal } from "@/features/auth/components/AuthModal";

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
