import "@/styles/globals.css"

import type { Metadata, Viewport } from "next"
import dynamic from "next/dynamic"
import Script from "next/script"
import type { Person, ProfilePage, WebSite, WithContext } from "schema-dts"

import { Providers } from "@/components/providers"
import { META_THEME_COLORS, SITE_INFO } from "@/config/site"
import { USER } from "@/features/portfolio/data/user"
import { SITE_OG_IMAGE } from "@/lib/seo"
import { decodeEmail } from "@/utils/string"

const Analytics =
  process.env.VERCEL === "1"
    ? dynamic(() => import("@vercel/analytics/next").then((m) => m.Analytics))
    : null
const SpeedInsights =
  process.env.VERCEL === "1"
    ? dynamic(() =>
        import("@vercel/speed-insights/next").then((m) => m.SpeedInsights)
      )
    : null

const fallbackProfileTitle = `${USER.displayName} | AI & Machine Learning Engineer`
const profileTitle = USER.seoTitle ?? fallbackProfileTitle
const profileDescription = USER.seoDescription ?? USER.bio

function absoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http")) return pathOrUrl
  return `${SITE_INFO.url}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`
}

function getWebSiteJsonLd(): WebSite {
  return {
    "@type": "WebSite",
    "@id": `${SITE_INFO.url}/#website`,
    url: SITE_INFO.url,
    name: SITE_INFO.name,
    description: profileDescription,
    inLanguage: "en-US",
    publisher: {
      "@id": `${SITE_INFO.url}/#person`,
    },
  }
}

function getProfilePageJsonLd(): WithContext<ProfilePage> {
  const email = decodeEmail(USER.email)
  const person: Person = {
    "@type": "Person",
    "@id": `${SITE_INFO.url}/#person`,
    name: USER.displayName,
    alternateName: [USER.username],
    url: SITE_INFO.url,
    image: absoluteUrl(USER.avatar),
    jobTitle: USER.jobTitle,
    email: `mailto:${email}`,
    telephone: USER.phone,
    description: profileDescription,
    knowsAbout: USER.keywords,
    sameAs: USER.sameAs,
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "Universitas Dian Nuswantoro",
        url: "https://dinus.ac.id",
      },
    ],
    worksFor: USER.jobs.map((job) => ({
      "@type": "Organization",
      name: job.company,
      url: job.website,
    })),
    address: {
      "@type": "PostalAddress",
      addressCountry: USER.address,
    },
    mainEntityOfPage: `${SITE_INFO.url}/#profile-page`,
  }

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE_INFO.url}/#profile-page`,
    url: SITE_INFO.url,
    name: profileTitle,
    headline: profileTitle,
    description: profileDescription,
    dateCreated: USER.dateCreated,
    dateModified: USER.dateModified,
    mainEntity: person,
  }
}

function getRootJsonLd() {
  const profilePage = getProfilePageJsonLd()
  const { "@context": context, ...profilePageGraphNode } = profilePage

  return {
    "@context": context,
    "@graph": [getWebSiteJsonLd(), profilePageGraphNode],
  }
}

// Runs synchronously before body paint to set the theme-color meta tag
// for the initial render. next-themes handles the `class` attribute swap.
const themeColorBootstrap = String.raw`
  try {
    var isDark = localStorage.theme !== 'light';
    if (isDark) {
      var meta = document.querySelector('meta[name=\"theme-color\"]');
      if (meta) meta.setAttribute('content', '${META_THEME_COLORS.dark}');
    }
  } catch (_) {}\

  try {
    if (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
      document.documentElement.classList.add('os-macos');
    }
  } catch (_) {}\
`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_INFO.url),
  title: {
    template: `%s | ${USER.displayName}`,
    default: profileTitle,
  },
  description: profileDescription,
  keywords: USER.keywords,
  applicationName: SITE_INFO.name,
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.webmanifest",
  authors: [
    {
      name: USER.displayName,
      url: SITE_INFO.url,
    },
  ],
  creator: USER.displayName,
  publisher: USER.displayName,
  openGraph: {
    siteName: USER.displayName,
    url: "/",
    type: "website",
    locale: "en_US",
    alternateLocale: ["id_ID"],
    title: profileTitle,
    description: profileDescription,
    images: [{ ...SITE_OG_IMAGE, url: absoluteUrl(SITE_OG_IMAGE.url) }],
  },
  twitter: {
    card: "summary_large_image",
    title: profileTitle,
    description: profileDescription,
    creator: `@${USER.username}`,
    images: [absoluteUrl(SITE_OG_IMAGE.url)],
  },
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    title: SITE_INFO.name,
    capable: true,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The on-screen keyboard resizes the visual viewport only, so it leaves both
  // the layout viewport and `dvh` alone - the floating dock stays put while
  // typing instead of being shoved up over the chat panel's own input. Stated
  // explicitly rather than relied on as a default.
  interactiveWidget: "resizes-visual",
  themeColor: META_THEME_COLORS.dark,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No preconnect/dns-prefetch here on purpose: the GitHub contributions
            API is only ever called server-side (see data/github-contributions),
            and cdn.simpleicons.org is gone since all icons are inline SVG. The
            browser never opens a connection to either, so hinting them just
            wasted a connection slot and tripped Lighthouse's unused-preconnect
            audit. */}
        <Script
          id="theme-color-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeColorBootstrap }}
        />
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms.txt"
          title="LLMs.txt"
        />
        <link
          rel="preload"
          href="/fonts/geist-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Decorative display face, used only by panel titles and the footer
            colophon - all below the fold. Preloaded so it never swaps in late,
            but at low priority so its 73 KB never competes with the LCP
            banner on a mobile connection. */}
        <link
          rel="preload"
          href="/fonts/caveat-latin.woff2"
          as="font"
          type="font/woff2"
          fetchPriority="low"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/geist-mono-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <Script
          id="root-jsonld"
          strategy="beforeInteractive"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getRootJsonLd()).replace(/</g, "\\u003c"),
          }}
        />
      </head>

      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
        {Analytics ? <Analytics /> : null}
        {SpeedInsights ? <SpeedInsights /> : null}
      </body>
    </html>
  )
}
