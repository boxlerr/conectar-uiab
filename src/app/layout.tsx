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
import { RecargaTrasDeploy } from "@/components/plantillas/recarga-tras-deploy";
import { cn } from "@/lib/utilidades";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/servidor";
import { resolverEntidadDePerfil } from "@/modulos/autenticacion/entidad-del-perfil";
import type { User } from "@/tipos";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

import { grafoSitio } from "@/lib/seo/entidad";

/**
 * Organization (el directorio) + Organization (la cámara) + WebSite.
 *
 * Son DOS organizaciones emparentadas, no una. El detalle de por qué está en
 * src/lib/seo/entidad.ts: mientras este grafo declaró que UIAB Conecta se
 * llamaba también "Unión Industrial de Almirante Brown", el sitio le competía
 * la identidad a uiab.org en vez de heredarla, y Google resolvía la consulta de
 * marca hacia el titular más viejo.
 *
 * Viaja en todas las páginas, así que cualquier ruta puede citar sus nodos por
 * `@id` en vez de duplicarlos.
 */
const JSON_LD_SITIO = grafoSitio();

export const metadata: Metadata = {
  metadataBase: new URL("https://www.uiabconecta.com"),
  title: {
    default: "UIAB Conecta | Directorio Industrial",
    template: "%s | UIAB Conecta",
  },
  // Arranca con la marca literal a propósito. Para una consulta de marca en un
  // dominio nuevo y sin backlinks, la coincidencia exacta del nombre en title +
  // description + H1 es casi la única señal de relevancia propia disponible;
  // antes esta línea empezaba por "Directorio comercial B2B de la Unión
  // Industrial…", o sea nombrando a la entidad que ya rankea y no a esta.
  description:
    "UIAB Conecta es el directorio comercial B2B de la Unión Industrial de Almirante Brown: empresas socias, prestadores de productos y servicios, entidades financieras y educativas y cooperativas verificadas de Almirante Brown.",
  applicationName: "UIAB Conecta",
  // OJO: acá NO va `alternates`. Los campos de metadata se heredan hacia abajo,
  // así que un `canonical: "/"` en la raíz se lo comía TODO el sitio: /directorio,
  // /sumate, /contacto, /terminos, /privacidad y /cookies salían declarando que
  // la home era su versión canónica, o sea "soy un duplicado de la portada".
  // Google las plegaba contra la home y no las indexaba — de 64 URLs del sitemap
  // había 10 indexadas, y /directorio ni siquiera figuraba como rastreada.
  // El canonical va SIEMPRE en la ruta, nunca en la raíz (la home tiene el suyo
  // en src/app/page.tsx).
  keywords: [
    "UIAB",
    "UIAB Conecta",
    "Unión Industrial de Almirante Brown",
    "directorio industrial",
    "empresas Almirante Brown",
    "proveedores industriales",
  ],
  icons: {
    icon: [
      { url: "/icono-uiab.svg", type: "image/svg+xml" },
      { url: "/icono-uiab.png", type: "image/png" },
    ],
    apple: "/icono-uiab.png",
  },
  openGraph: {
    type: "website",
    siteName: "UIAB Conecta",
    title: "UIAB Conecta | Directorio Industrial",
    description: "Directorio Comercial de la Unión Industrial de Almirante Brown",
    url: "https://www.uiabconecta.com",
    locale: "es_AR",
    images: [{ url: "/industrial-b2b-header.png", width: 1200, height: 630, alt: "UIAB Conecta" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UIAB Conecta | Directorio Industrial",
    description: "Directorio Comercial de la Unión Industrial de Almirante Brown",
    images: ["/industrial-b2b-header.png"],
  },
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
      .select('id, nombre_completo, rol_sistema, activo, tutoriales_vistos, creado_en')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    let entidadEstado: string | null = null;
    let logoUrl: string | null = null;

    const resolverLogoUrl = (bucket?: string | null, ruta?: string | null): string | null => {
      if (!bucket || !ruta) return null;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(ruta);
      return pub?.publicUrl ?? null;
    };

    // La ficha se resuelve por MEMBRESÍA, no por `rol_sistema`.
    //
    // Este archivo se quedó afuera de la migración a `entidad-del-perfil` y era
    // el que rompía: ramificaba en `rol_sistema === 'company' | 'provider'`, así
    // que un ADMIN con ficha propia (Vaxler) no matcheaba ninguna rama, salía con
    // `entityId: null` y sin `entityRole`. Y como el AuthProvider recibe este
    // objeto como `initialUser`, el cliente NO vuelve a resolverlo: se queda con
    // esta versión incompleta. Resultado: /perfil rebotaba al admin con "Debes
    // dirigirte al panel de administración" aunque su ficha estuviera bien
    // vinculada, mientras /panel-de-control (que resuelve aparte) sí la mostraba.
    const entidad = await resolverEntidadDePerfil(supabase, user.id);
    const entityId = entidad?.id ?? null;
    const entityRole = entidad?.tipo ?? null;

    if (entidad?.tipo === 'company') {
      const { data: emp } = await supabase
        .from('empresas')
        .select('estado, ruta_logo, bucket_logo')
        .eq('id', entidad.id)
        .maybeSingle();
      entidadEstado = emp?.estado ?? null;
      logoUrl = resolverLogoUrl(emp?.bucket_logo, emp?.ruta_logo);
    } else if (entidad?.tipo === 'provider') {
      const { data: prov } = await supabase
        .from('proveedores')
        .select('estado, ruta_logo, bucket_logo')
        .eq('id', entidad.id)
        .maybeSingle();
      entidadEstado = prov?.estado ?? null;
      logoUrl = resolverLogoUrl(prov?.bucket_logo, prov?.ruta_logo);
    }

    let subscriptionEstado: string | null = null;
    if (entidad) {
      const fk = entidad.tipo === 'company' ? 'empresa_id' : 'proveedor_id';
      const { data: sub } = await supabase
        .from('suscripciones')
        .select('estado')
        .eq(fk, entidad.id)
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
      entityRole,
      subscriptionEstado,
      tutorialesVistos: ((profile as any).tutoriales_vistos ?? {}) as Record<string, string | null>,
      creadoEn: (profile as any).creado_en ?? null,
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
        className={`${openSans.variable} ${poppins.variable} ${manrope.variable} ${inter.variable} font-sans antialiased min-h-svh bg-slate-50`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SITIO) }}
        />
        <AuthProvider initialUser={initialUser}>
          <TourProvider>
            <Suspense>
              <AppShell>{children}</AppShell>
            </Suspense>
          </TourProvider>
        </AuthProvider>
        <Toaster />
        <RecargaTrasDeploy />
        <Analytics />
      </body>
    </html>
  );
}

