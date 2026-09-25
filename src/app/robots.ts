import type { MetadataRoute } from "next"

import { SITE_INFO } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_INFO.url}/sitemap.xml`,
  }
}
