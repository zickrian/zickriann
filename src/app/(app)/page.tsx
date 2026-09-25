import type { Metadata } from "next"
import dynamic from "next/dynamic"

import { SectionSeparator } from "@/components/section-separator"
import { Experiences } from "@/features/portfolio/components/experiences"
import { Projects } from "@/features/portfolio/components/projects"
import { TechStack } from "@/features/portfolio/components/tech-stack"
import { USER } from "@/features/portfolio/data/user"

// Below-fold components dynamically imported with SSR enabled
// to keep full SEO while code-splitting the initial JS payload
const GitHubContributions = dynamic(
  () =>
    import("@/features/portfolio/components/github-contributions").then(
      (m) => m.GitHubContributions
    ),
  { ssr: true }
)

const Awards = dynamic(
  () =>
    import("@/features/portfolio/components/awards").then((m) => m.Awards),
  { ssr: true }
)

const Publications = dynamic(
  () =>
    import("@/features/portfolio/components/publications").then(
      (m) => m.Publications
    ),
  { ssr: true }
)

const Certifications = dynamic(
  () =>
    import("@/features/portfolio/components/certifications").then(
      (m) => m.Certifications
    ),
  { ssr: true }
)

export const metadata: Metadata = {
  title: {
    absolute: USER.seoTitle ?? USER.displayName,
  },
  description: USER.seoDescription,
  keywords: USER.keywords,
  authors: [{ name: USER.displayName, url: USER.website }],
  creator: USER.displayName,
  publisher: USER.displayName,
  alternates: {
    canonical: "/",
  },
}

export default function Page() {
  return (
    <>
      <SectionSeparator />

      <Experiences />
      <SectionSeparator />

      <Projects />
      <SectionSeparator />

      <TechStack />
      <SectionSeparator />

      <GitHubContributions />
      <SectionSeparator />

      <Awards />
      <SectionSeparator />

      <Publications />
      <SectionSeparator />

      <Certifications />
      <SectionSeparator />
    </>
  )
}
