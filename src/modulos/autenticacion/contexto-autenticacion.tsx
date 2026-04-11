"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/tipos";
import { createClient } from "@/lib/supabase/cliente";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  /** Initial user resolved on the server — avoids loading flash on first render */
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  // When initialUser is provided from the server, we skip the loading state entirely
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  // Guard against running the initial fetch if we already have a server user
  const initialFetchDone = useRef(!!initialUser);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
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
        let entityId = null;

        // Fetch Business Layer ID mapping
        if (data.rol_sistema === 'company') {
          const { data: memberData } = await supabase
            .from('miembros_empresa')
            .select('empresa_id')
            .eq('perfil_id', userId)
            .single();
          entityId = memberData?.empresa_id;
        } else if (data.rol_sistema === 'provider') {
          const { data: memberData } = await supabase
            .from('miembros_proveedor')
            .select('proveedor_id')
            .eq('perfil_id', userId)
            .single();
          entityId = memberData?.proveedor_id;
        }

        return {
          id: data.id,
          name: data.nombre_completo || email.split('@')[0],
          email: email,
          role: data.rol_sistema as any,
          isMember: data.activo || false,
          entityId: entityId,
        };
      }
    } catch (err) {
      console.error("AuthContext fetchProfile error:", err);
    }
    return null;
  }, [supabase]);

  // Uses getUser() which validates the JWT server-side (NOT getSession() which only reads localStorage)
  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setCurrentUser(null);
      } else {
        const profile = await fetchProfile(user.id, user.email!);
        setCurrentUser(profile);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    // Only fetch on mount if we didn't receive initialUser from the server
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      refreshUser();
    }

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email!);
          setCurrentUser(profile);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setLoading(false);
      }
      // Ignore INITIAL_SESSION — we handle it ourselves via initialUser or refreshUser
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, refreshUser]);

  const isLoggingOut = useRef(false);

  const logout = async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
      setCurrentUser(null);
      router.push('/');
    } finally {
      isLoggingOut.current = false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        logout,
        refreshUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
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
