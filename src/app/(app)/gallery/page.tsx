import Image from "next/image"
import Script from "next/script"

import { GalleryVideo } from "@/components/gallery-video"
import { SectionSeparator } from "@/components/section-separator"
import { SITE_INFO } from "@/config/site"
import { createPageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

const title = "AI & Software Project Gallery"
const description =
  "A look at my AI projects, hackathons, technical events, and the software work behind them."
const keywords = [
  "Firdaus Khotibul Zickrian gallery",
  "zickrian portfolio gallery",
  "AI project showcase",
  "machine learning project gallery",
  "software engineering portfolio",
]

export const metadata = createPageMetadata({
  title,
  description,
  path: "/gallery",
  keywords,
})

type GalleryItem = {
  src: string
  title: string
  date: string
  type?: "image" | "video"
  aspect?: "square" | "wide"
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/image/basee.webp",
    title: "Base Realms hackathon project showcase",
    date: "2025",
  },
  {
    src: "https://res.cloudinary.com/dujp9ydkx/video/upload/WhatsApp_Video_2026-05-11_at_13.12.10_pmvmgx",
    title: "AI and software development journey video",
    date: "2026",
    type: "video",
  },
  {
    src: "/image/picture1.webp",
    title: "Technology event and project collaboration moment",
    date: "2026",
    aspect: "wide",
  },
  {
    src: "/image/btng.webp",
    title: "Behind-the-scenes software project work",
    date: "2026",
    aspect: "wide",
  },
]

function getGalleryJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "@id": `${SITE_INFO.url}/gallery#gallery`,
    url: `${SITE_INFO.url}/gallery`,
    name: title,
    description,
    inLanguage: "en-US",
    isPartOf: {
      "@id": `${SITE_INFO.url}/#website`,
    },
    associatedMedia: GALLERY_ITEMS.map((item) => ({
      "@type": item.type === "video" ? "VideoObject" : "ImageObject",
      name: item.title,
      contentUrl: item.src.startsWith("http")
        ? item.src
        : `${SITE_INFO.url}${item.src}`,
      uploadDate: item.date,
      thumbnailUrl:
        item.type === "video"
          ? `${SITE_INFO.url}/image/btng-poster-v1.webp`
          : undefined,
    })),
  }
}

export default function GalleryPage() {
  return (
    <>
      <Script
        id="gallery-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getGalleryJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <SectionSeparator />
      <div className="relative z-1 -mt-px border-x border-t border-line bg-card max-md:border-x-0">
        <div className="grid grid-cols-1 gap-px border-b border-line bg-line sm:grid-cols-2">
          {GALLERY_ITEMS.map((item, index) => (
            <GalleryCard key={item.src} item={item} eager={index < 2} />
          ))}
          {GALLERY_ITEMS.length % 2 === 1 && (
            <div className="hidden min-h-62.5 flex-col items-center justify-center bg-card p-6 select-none sm:flex">
              <span className="font-handwritten text-3xl font-medium tracking-wider text-muted-foreground">
                Still cooking
              </span>
            </div>
          )}
        </div>

        {/* Butts straight against the last row's rule, with no gap - that rule
            becomes the band's top edge and closes the box, which is what the
            home page's sections do. A spacer here left the band floating. */}
        <SectionSeparator sides={false} />
      </div>
    </>
  )
}

function GalleryCard({ item, eager }: { item: GalleryItem; eager?: boolean }) {
  return (
    <div className="flex flex-col gap-2 bg-card p-3">
      <div
        className={cn(
          "group/media relative overflow-hidden rounded-xl select-none",
          item.aspect === "wide" ? "aspect-2/1" : "aspect-square"
        )}
      >
        {item.type === "video" ? (
          <GalleryVideo
            src={item.src}
            poster="/image/btng-poster-v1.webp"
            title={item.title}
            className="absolute inset-0 size-full object-cover object-[center_30%]"
          />
        ) : (
          <Image
            src={item.src}
            alt={item.title}
            fill
            sizes="(min-width: 768px) 360px, calc(100vw - 16px)"
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            quality={75}
            // Matches the lift the project cards already have, so the two grids
            // respond to the pointer the same way.
            className="object-cover transition-transform duration-500 ease-out group-hover/media:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
          />
        )}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/10 ring-inset dark:ring-white/10" />
      </div>
    </div>
  )
}
