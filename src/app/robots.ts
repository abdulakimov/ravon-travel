import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // API hamda shaxsiy bron/to'lov sahifalari indekslanmaydi
      disallow: ["/api/", "/*/book/", "/*/pay/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
