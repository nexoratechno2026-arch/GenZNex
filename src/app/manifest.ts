import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GenZNex - Next-Gen EdTech Academy India",
    short_name: "GenZNex",
    description: "Master modern software engineering, GenAI, and cloud with cohort bootcamps and verifiable credentials.",
    start_url: "/",
    display: "standalone",
    background_color: "#090a0f",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
