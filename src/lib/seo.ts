import type { Metadata } from "next"

import { SITE_INFO } from "@/config/site"
import { USER } from "@/features/portfolio/data/user"

export const SITE_OG_IMAGE = {
  url: SITE_INFO.ogImage,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${USER.displayName} portfolio - ${USER.jobTitle}`,
} as const

type PageMetadataOptions = {
  title: string
  description: string
  path: string
  keywords: string[]
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    keywords,
    authors: [{ name: USER.displayName, url: SITE_INFO.url }],
    creator: USER.displayName,
    publisher: USER.displayName,
    alternates: {
      canonical: path,
    },
    openGraph: {
      siteName: USER.displayName,
      url: path,
      type: "website",
      title,
      description,
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: `@${USER.username}`,
      images: [SITE_OG_IMAGE.url],
    },
  }
}
