import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UIAB Conecta",
    short_name: "UIAB Conecta",
    description:
      "Directorio comercial B2B de la Unión Industrial de Almirante Brown.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#00213f",
    lang: "es-AR",
    icons: [
      {
        src: "/icono-uiab.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icono-uiab.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
