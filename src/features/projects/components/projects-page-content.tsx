"use client"

import { useEffect } from "react"

import type { Project } from "@/features/portfolio/types/projects"

import { ProjectGrid } from "./project-card"

export function ProjectsPageContent({ projects }: { projects: Project[] }) {
  useEffect(() => {
    // Restore scroll position when returning from a project detail page
    const fromDetail = sessionStorage.getItem("projects_from_detail")
    if (fromDetail === "true") {
      sessionStorage.removeItem("projects_from_detail")
      const savedY = sessionStorage.getItem("projects_scroll_y")
      if (savedY !== null) {
        const y = parseInt(savedY, 10)
        if (!isNaN(y)) {
          window.scrollTo({ top: y, behavior: "instant" })
          // Double-check after frame render for any layout stabilization
          const frame = requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: "instant" })
          })
          return () => cancelAnimationFrame(frame)
        }
      }
    }
  }, [])

  return <ProjectGrid projects={projects} />
}
