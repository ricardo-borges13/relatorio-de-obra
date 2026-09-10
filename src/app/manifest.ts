import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relatórios de Obra",
    short_name: "Relatórios",
    description: "Criação de relatórios fotográficos de obra com funcionamento local e offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f4",
    theme_color: "#26363e",
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/riow-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/riow-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
