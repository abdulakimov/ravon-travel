import type { MetadataRoute } from "next";
import { site } from "@/config/site";

// PWA / "Bosh ekranga qo'shish" uchun. Ranglar — logodagi chuqur yashil (--ink).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    start_url: "/",
    display: "browser",
    background_color: "#002F1A",
    theme_color: "#002F1A",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
