import type { Metadata } from "next";
import { Poppins, Open_Sans, Geist, Manrope, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"


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

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

import { AuthProvider } from "@/modulos/autenticacion/contexto-autenticacion";
import { TourProvider } from "@/modulos/onboarding/contexto-tour";
import { AppShell } from "@/components/plantillas/app-shell";
import { cn } from "@/lib/utilidades";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/servidor";
import type { User } from "@/tipos";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
      .select('id, nombre_completo, rol_sistema, activo, tutoriales_vistos')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    let entityId: string | null = null;
    let entidadEstado: string | null = null;
    let logoUrl: string | null = null;

    const resolverLogoUrl = (bucket?: string | null, ruta?: string | null): string | null => {
      if (!bucket || !ruta) return null;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(ruta);
      return pub?.publicUrl ?? null;
    };

    if (profile.rol_sistema === 'company') {
      const { data: memberData } = await supabase
        .from('miembros_empresa')
        .select('empresa_id, empresas:empresa_id(estado, ruta_logo, bucket_logo)')
        .eq('perfil_id', user.id)
        .single();
      entityId = memberData?.empresa_id ?? null;
      const ent = (memberData as any)?.empresas;
      entidadEstado = ent?.estado ?? null;
      logoUrl = resolverLogoUrl(ent?.bucket_logo, ent?.ruta_logo);
    } else if (profile.rol_sistema === 'provider') {
      const { data: memberData } = await supabase
        .from('miembros_proveedor')
        .select('proveedor_id, proveedores:proveedor_id(estado, ruta_logo, bucket_logo)')
        .eq('perfil_id', user.id)
        .single();
      entityId = memberData?.proveedor_id ?? null;
      const ent = (memberData as any)?.proveedores;
      entidadEstado = ent?.estado ?? null;
      logoUrl = resolverLogoUrl(ent?.bucket_logo, ent?.ruta_logo);
    }

    let subscriptionEstado: string | null = null;
    if (entityId && (profile.rol_sistema === 'company' || profile.rol_sistema === 'provider')) {
      const fk = profile.rol_sistema === 'company' ? 'empresa_id' : 'proveedor_id';
      const { data: sub } = await supabase
        .from('suscripciones')
        .select('estado')
        .eq(fk, entityId)
        .order('creado_en', { ascending: false })
        .limit(1)
        .maybeSingle();
      subscriptionEstado = sub?.estado ?? null;
    }

    return {
      id: profile.id,
      name: profile.nombre_completo || user.email!.split('@')[0],
      email: user.email!,
      role: profile.rol_sistema as User['role'],
      isMember: profile.activo || false,
      entityId,
      subscriptionEstado,
      tutorialesVistos: ((profile as any).tutoriales_vistos ?? {}) as Record<string, string | null>,
      entidadEstado,
      logoUrl,
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
        className={`${openSans.variable} ${poppins.variable} ${manrope.variable} ${inter.variable} font-sans antialiased min-h-screen bg-slate-50`}
      >
        <AuthProvider initialUser={initialUser}>
          <TourProvider>
            <Suspense>
              <AppShell>{children}</AppShell>
            </Suspense>
          </TourProvider>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

