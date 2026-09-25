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
  description?: string
  highlight?: string
  type?: "image" | "video"
  aspect?: "square" | "wide"
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/image/basee.webp",
    title: "Base Realms Hackathon Showcase",
    date: "2025",
    description:
      "On-stage presentation and live gameplay demonstration of Base Realms at the Coinbase Hackathon Indonesia 2025, introducing an onchain RPG with seamless QR onboarding.",
    highlight: "Top 5 Finalist · Coinbase Hackathon",
  },
  {
    src: "https://res.cloudinary.com/dujp9ydkx/video/upload/WhatsApp_Video_2026-05-11_at_13.12.10_pmvmgx",
    title: "FIK Preneur Week · Udinus",
    date: "2024",
    type: "video",
    description:
      "Project pitching and technology showcase session at FIK Preneur Week (Venture Ignition), presenting student-built digital product innovation at Universitas Dian Nuswantoro.",
    highlight: "Venture Ignition · Pitching Showcase",
  },
  {
    src: "/image/picture1.webp",
    title: "Tech Sharing for High School Students",
    date: "2024",
    aspect: "wide",
    description:
      "Interactive tech sharing and mentoring session with high school students, introducing modern software engineering, AI tooling, and future career pathways in technology.",
    highlight: "Mentorship & Tech Education",
  },
  {
    src: "/image/btng.webp",
    title: "BTNG: Mobile Development Course",
    date: "2024",
    aspect: "wide",
    description:
      "Completing the intensive Basic Training for Next Generation (BTNG) mobile development track, focusing on hands-on application building and collaborative engineering.",
    highlight: "Basic Training for Next Generation · Mobile Dev",
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
    <div className="flex flex-col bg-card p-3.5 sm:p-4">
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

      <div className="mt-3 flex flex-1 flex-col justify-between gap-2.5 px-0.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
              {item.title}
            </h3>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {item.date}
            </span>
          </div>
          {item.description && (
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>

        {item.highlight && (
          <span className="mt-auto font-mono text-[11px] text-muted-foreground/80">
            {item.highlight}
          </span>
        )}
      </div>
    </div>
  )
}
