import type { MetadataRoute } from "next"

import { SITE_INFO } from "@/config/site"
import { PROJECTS } from "@/features/portfolio/data/projects"
import { USER } from "@/features/portfolio/data/user"

export const revalidate = false
export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(USER.dateModified).toISOString()

  const routes = [
    { route: "", priority: 1 },
    { route: "/projects", priority: 0.9 },
    { route: "/blog", priority: 0.8 },
    { route: "/gallery", priority: 0.6 },
  ].map(({ route, priority }) => ({
    url: `${SITE_INFO.url}${route}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }))

  const projects = PROJECTS.map((project) => ({
    url: `${SITE_INFO.url}/projects/${project.id}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [...routes, ...projects]
}
