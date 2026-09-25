import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Script from "next/script"

import { SITE_INFO } from "@/config/site"
import { PROJECTS, PROJECTS_BY_ID } from "@/features/portfolio/data/projects"
import { USER } from "@/features/portfolio/data/user"
import { ProjectDetail } from "@/features/projects/components/project-detail"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return PROJECTS.map((project) => ({
    slug: project.id,
  }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const project = PROJECTS_BY_ID[slug]

  if (!project) {
    return {}
  }

  const description = project.seoDescription ?? project.tagline
  const pageTitle = project.seoTitle ?? `${project.title} | Zickrian`
  const keywords = [
    project.title,
    project.category,
    ...project.skills,
    "Firdaus Khotibul Zickrian",
    "zickrian",
  ]

  return {
    title: {
      absolute: pageTitle,
    },
    description,
    keywords,
    authors: [{ name: USER.displayName, url: SITE_INFO.url }],
    creator: USER.displayName,
    publisher: USER.displayName,
    alternates: {
      canonical: `/projects/${project.id}`,
    },
    openGraph: {
      siteName: USER.displayName,
      url: `/projects/${project.id}`,
      type: "article",
      title: pageTitle,
      description,
      images: [
        {
          url: project.image,
          alt: `${project.title} project screenshot`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      creator: `@${USER.username}`,
      images: [project.image],
    },
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params
  const project = PROJECTS_BY_ID[slug]

  if (!project) {
    notFound()
  }

  const description = project.seoDescription ?? project.tagline
  const projectUrl = `${SITE_INFO.url}/projects/${project.id}`
  const imageUrl = project.image.startsWith("http")
    ? project.image
    : `${SITE_INFO.url}${project.image}`
  const sameAs = [project.links.live, project.links.repo].filter(
    (link): link is string => Boolean(link && /^https?:\/\//.test(link))
  )
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${projectUrl}#software`,
        url: projectUrl,
        name: project.title,
        headline: project.title,
        description,
        image: imageUrl,
        applicationCategory: project.category,
        operatingSystem: "Web",
        dateCreated: project.period.start,
        keywords: project.skills,
        programmingLanguage: project.skills,
        sameAs,
        isPartOf: {
          "@id": `${SITE_INFO.url}/#website`,
        },
        creator: {
          "@id": `${SITE_INFO.url}/#person`,
        },
        author: {
          "@id": `${SITE_INFO.url}/#person`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${projectUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_INFO.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Projects",
            item: `${SITE_INFO.url}/projects`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: project.title,
            item: projectUrl,
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id={`project-jsonld-${project.id}`}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProjectDetail project={project} />
    </>
  )
}
