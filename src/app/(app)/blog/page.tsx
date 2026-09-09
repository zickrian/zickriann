// ISR: page is generated once and served from cache for 30 min.
// After 30 min, Next.js regenerates it in the background on the next request.
// Zero compute per visitor - only one server render per 30-min window.
export const revalidate = 1800

import Script from "next/script"

import { SectionSeparator } from "@/components/section-separator"
import { SITE_INFO } from "@/config/site"
import { BlogPageContent } from "@/features/blog/components/blog-page-content"
import { createPageMetadata } from "@/lib/seo"

const title = "Notes on AI & Machine Learning"
const description =
  "I write about the tools, ideas, and lessons behind the AI and software projects I work on."
const keywords = [
  "Firdaus Khotibul Zickrian writing",
  "zickrian blog",
  "AI engineering writing",
  "machine learning articles",
  "software engineering blog",
]

function getBlogJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_INFO.url}/blog#blog`,
    url: `${SITE_INFO.url}/blog`,
    name: title,
    description,
    inLanguage: "en-US",
    author: {
      "@type": "Person",
      name: SITE_INFO.name,
      url: SITE_INFO.url,
    },
    isPartOf: {
      "@id": `${SITE_INFO.url}/#website`,
    },
  }
}

export const metadata = createPageMetadata({
  title,
  description,
  path: "/blog",
  keywords,
})

export default function BlogPage() {
  return (
    <>
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getBlogJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <SectionSeparator />
      <div className="relative z-1 -mt-px border-x border-t border-line bg-card max-md:border-x-0">
        <BlogPageContent />

        <SectionSeparator sides={false} />
      </div>
    </>
  )
}
