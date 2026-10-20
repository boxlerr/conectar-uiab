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
 * El layout raíz NO lee la sesión. Cuando lo hacía (`getServerUser()`, ahora en
 * modulos/autenticacion/usuario-del-servidor.tsx) leía cookies en cada request
 * y eso volvía dinámicas a las 81 rutas: ni /nosotros ni las fichas podían
 * salir del CDN, y sus `revalidate` no hacían nada.
 *
 * El `AuthProvider` arranca en estado desconocido y resuelve en el cliente; las
 * secciones privadas, que igual son dinámicas, siembran el usuario del servidor
 * con `ConUsuarioDelServidor`. Antes de agregar acá cualquier cosa que lea
 * cookies, headers o searchParams: rompe el caché de TODO el sitio.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${poppins.variable} ${manrope.variable} ${inter.variable} font-sans antialiased min-h-svh bg-slate-50`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SITIO) }}
        />
        <AuthProvider>
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

