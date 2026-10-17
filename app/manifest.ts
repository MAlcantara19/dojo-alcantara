import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dojô Alcântara",
    short_name: "Dojô Alcântara",
    description: "Avisos, calendário e conteúdo de judô.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0414",
    theme_color: "#2b0f57",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
