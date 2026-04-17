import type { Metadata } from "next";
import { Poppins, Open_Sans, Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

import { AuthProvider } from "@/modulos/autenticacion/contexto-autenticacion";
import { AppShell } from "@/components/plantillas/app-shell";
import { cn } from "@/lib/utilidades";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/servidor";
import type { User } from "@/tipos";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "UIAB Conecta | Directorio Industrial",
  description: "Directorio Comercial de la Unión Industrial de Almirante Brown",
};

/**
 * Resolves the current user on the server using getUser() (JWT-validated).
 * Returns null if no session or on error — never throws.
 */
async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, rol_sistema, activo')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    let entityId: string | null = null;

    if (profile.rol_sistema === 'company') {
      const { data: memberData } = await supabase
        .from('miembros_empresa')
        .select('empresa_id')
        .eq('perfil_id', user.id)
        .single();
      entityId = memberData?.empresa_id ?? null;
    } else if (profile.rol_sistema === 'provider') {
      const { data: memberData } = await supabase
        .from('miembros_proveedor')
        .select('proveedor_id')
        .eq('perfil_id', user.id)
        .single();
      entityId = memberData?.proveedor_id ?? null;
    }

    return {
      id: profile.id,
      name: profile.nombre_completo || user.email!.split('@')[0],
      email: user.email!,
      role: profile.rol_sistema as User['role'],
      isMember: profile.activo || false,
      entityId,
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getServerUser();

  return (
    <html lang="es" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${openSans.variable} ${poppins.variable} font-sans antialiased min-h-screen bg-slate-50`}
      >
        <AuthProvider initialUser={initialUser}>
          <Suspense>
            <AppShell>{children}</AppShell>
          </Suspense>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

