import type { Metadata } from "next";
import { Poppins, Geist, Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"


const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  /**
   * Sin preload: viaja en la cabecera `Link` de las 86 rutas y sólo se usa
   * como `--font-mono` (globals.css), o sea en el panel privado, que es
   * noindex. 39 KB compitiendo con el LCP de las páginas que sí rankean.
   * NO se puede borrar la familia: ~13 archivos usan `font-mono`.
   */
  preload: false,
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
import { GuardiaNavegacion } from "@/components/plantillas/guardia-navegacion";
import { cn } from "@/lib/utilidades";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/servidor";
import { obtenerEntidadSesion, obtenerPerfilSesion, obtenerSesion } from "@/lib/supabase/sesion-servidor";
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
  // ≤160 caracteres: más largo, Google la reescribe él. La enumeración larga
  // ("entidades financieras y educativas y cooperativas…") vive ahora sólo en
  // /directorio — home y directorio compartían casi la misma description.
  description:
    "UIAB Conecta es el directorio comercial B2B de la Unión Industrial de Almirante Brown: empresas socias, prestadores verificados y contacto directo.",
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
  // Los íconos van en PNG del tamaño justo. `icono-uiab.svg` (467 KB) e
  // `icono-uiab.png` (406 KB, 2048 px) son exportes de Canva con el PNG
  // embebido: el navegador elegía el SVG como favicon y bajaba casi medio
  // mega en la primera visita a cualquier página. Los archivos viejos siguen
  // en public/ porque hay URLs externas que los citan (JSON-LD, mails).
  icons: {
    icon: [{ url: "/icono-uiab-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "UIAB Conecta",
    title: "UIAB Conecta | Directorio Industrial",
    description: "Directorio Comercial de la Unión Industrial de Almirante Brown",
    url: "https://www.uiabconecta.com",
    locale: "es_AR",
    // 1200×630 REALES. `/industrial-b2b-header.png` es, pese a la extensión,
    // un JPEG cuadrado de 1024×1024: se declaraba con medidas que no tenía.
    images: [{ url: "/og-uiab-conecta.jpg", width: 1200, height: 630, alt: "UIAB Conecta" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UIAB Conecta | Directorio Industrial",
    description: "Directorio Comercial de la Unión Industrial de Almirante Brown",
    images: ["/og-uiab-conecta.jpg"],
  },
};

/**
 * Usuario de la sesión para el header y el `AuthProvider`. Nunca tira: sin
 * sesión o ante cualquier error devuelve null.
 *
 * Corre en CADA render con sesión y el layout lo espera antes de mandar el
 * primer byte de HTML, así que lo que importa son los viajes EN SERIE a
 * Supabase. Eran 5 (getUser → perfil → membresía → ficha → suscripción); ahora
 * son 2 rondas en paralelo: perfil ∥ membresía, y después ficha ∥ suscripción.
 * La sesión sale de `getClaims()`, que se verifica sin red, y perfil/membresía
 * vienen de `sesion-servidor.ts`, cacheados por request: si la página pide lo
 * mismo (el panel lo hace) no se vuelve a consultar.
 */
async function getServerUser(): Promise<User | null> {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return null;

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
    const [profile, entidad] = await Promise.all([
      obtenerPerfilSesion(sesion.id),
      obtenerEntidadSesion(sesion.id),
    ]);
    if (!profile) return null;

    const supabase = await createClient();
    const entityId = entidad?.id ?? null;
    const entityRole = entidad?.tipo ?? null;
    const tablaFicha = entidad?.tipo === 'company' ? 'empresas' : 'proveedores';
    const fk = entidad?.tipo === 'company' ? 'empresa_id' : 'proveedor_id';

    const [fichaRes, subRes] = await Promise.all([
      entidad
        ? supabase
            .from(tablaFicha)
            .select('estado, ruta_logo, bucket_logo')
            .eq('id', entidad.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      entidad
        ? supabase
            .from('suscripciones')
            .select('estado')
            .eq(fk, entidad.id)
            .order('creado_en', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const ficha = fichaRes.data as { estado: string | null; ruta_logo: string | null; bucket_logo: string | null } | null;
    const logoUrl =
      ficha?.bucket_logo && ficha?.ruta_logo
        ? supabase.storage.from(ficha.bucket_logo).getPublicUrl(ficha.ruta_logo).data?.publicUrl ?? null
        : null;
    const email = sesion.email ?? profile.email ?? '';

    return {
      id: profile.id,
      name: profile.nombre_completo || email.split('@')[0],
      email,
      role: profile.rol_sistema as User['role'],
      isMember: profile.activo || false,
      entityId,
      entityRole,
      subscriptionEstado: (subRes.data as { estado: string | null } | null)?.estado ?? null,
      tutorialesVistos: profile.tutoriales_vistos ?? {},
      creadoEn: profile.creado_en ?? null,
      entidadEstado: ficha?.estado ?? null,
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
    <html lang="es-AR" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${poppins.variable} ${manrope.variable} ${inter.variable} font-sans antialiased min-h-svh bg-slate-50`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SITIO) }}
        />
        <AuthProvider initialUser={initialUser}>
          <TourProvider>
            <AppShell>{children}</AppShell>
          </TourProvider>
        </AuthProvider>
        <Toaster />
        <RecargaTrasDeploy />
        <GuardiaNavegacion />
        <Analytics />
      </body>
    </html>
  );
}

