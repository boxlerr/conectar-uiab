import type { MetadataRoute } from "next";

const BASE_URL = "https://www.uiabconecta.com";

/**
 * Bloquea el crawling de las áreas privadas / autenticadas (panel admin,
 * dashboard, perfil del socio, endpoints internos y el flujo de auth). Las
 * landings públicas de marketing quedan indexables. El contenido sensible del
 * directorio ya está detrás de login, así que los buscadores no lo ven.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/perfil",
        "/api/",
        "/suscripcion",
        "/pendiente-aprobacion",
        "/bienvenido",
        "/confirmar-email",
        "/restablecer-password",
        "/recovery",
        "/login",
        "/register",
        "/403",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
