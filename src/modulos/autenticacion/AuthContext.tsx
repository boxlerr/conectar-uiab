"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import type { User } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          name: data.nombre_completo || email.split('@')[0],
          email: email,
          role: data.rol_sistema as any,
          isMember: data.activo || false,
        };
      }
    } catch (err) {
      console.error("AuthContext fetchProfile error:", err);
    }
    return null;
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const profile = await fetchProfile(session.user.id, session.user.email!);
      if (profile) {
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  }, [supabase, fetchProfile]);

  useEffect(() => {
    // Initial session check
    refreshUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          setCurrentUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, refreshUser]);

  const login = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
