"use client";

import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";

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
