import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    /**
     * Vercel cobra una "transformation" por cada MISS y por cada STALE, y la TTL
     * de una imagen remota es max(Cache-Control del origen, minimumCacheTTL).
     * Con el default (4 h) los ~50 logos de socias del marquee se re-optimizaban
     * 6 veces por día sin haber cambiado nunca. 31 días es el máximo que cachea
     * el CDN de Vercel, y es seguro porque cada logo se sube a una ruta única
     * (`logo-<timestamp>.ext`): un logo nuevo es una URL nueva, no un reemplazo.
     */
    minimumCacheTTL: 2678400,
    /**
     * Menos anchos = menos claves de caché distintas (cada ancho es una
     * transformation aparte). Recortado a lo que el sitio realmente usa.
     */
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
