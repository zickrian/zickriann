import { AsciiFooterBanner } from "@/components/ascii-footer-banner"
import { FooterIndexList, FooterLabel } from "@/components/footer-chrome"
import { FooterClock } from "@/components/footer-clock"
import { FooterContactList } from "@/components/footer-contact-list"
import { MAIN_NAV } from "@/config/site"
import { getGitHubSocialCard } from "@/features/portfolio/data/github-social"
import { USER } from "@/features/portfolio/data/user"
import { brailleText } from "@/lib/braille"

/**
 * Swiss editorial footer, after cali.so: each column is a directory listing
 * with box-drawing connectors, and the left cell is the colophon - copyright,
 * printer's mark, and the two location stamps.
 *
 * The ruled frame and container widths are this site's own, so the
 * footer still belongs to the page it sits under.
 */

const INDEX_LINKS = [
  { title: "Home", href: "/" },
  ...MAIN_NAV,
  { title: "LLMs.txt", href: "/llms.txt" },
]

export async function SiteFooter() {
  // Baked at build time on the statically prerendered routes, which is why it
  // is read here rather than in a client component: a year resolved in the
  // browser would not match the prerendered HTML.
  const year = new Date().getFullYear()

  // Both calls behind it are cached for a day and swallow their own failures,
  // so a slow or rate-limited GitHub degrades the card, never the page.
  const github = await getGitHubSocialCard()

  return (
    <footer className="relative z-1 max-w-screen overflow-x-hidden sm:px-2">
      <div className="relative mx-auto -mt-px border-x border-t border-b-0 border-line bg-card max-md:border-x-0 group-has-data-[slot=layout-wide]/layout:container md:max-w-[720px]">
        {/* Video preview banner first */}
        <AsciiFooterBanner />

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 px-4 pt-8 pb-6 text-sm text-muted-foreground sm:grid-cols-3">
          {/* Colophon. Last on mobile where it reads as a sign-off, first on
              desktop where it anchors the row. */}
          <div className="col-span-2 flex flex-col justify-between gap-6 sm:order-first sm:col-span-1">
            <div>
              <p className="font-handwritten tracking-tight">
                © {year} {USER.displayName}
              </p>
              {/* The handle echoed in braille - a printer's mark on the sheet. */}
              <p className="footer-braille" aria-hidden>
                {brailleText(USER.username)}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <FooterClock timeZone={USER.timeZone} place={USER.address} />

              {/* Location stamp: the colophon's place line, a decorative twin of
                  the clock. Coordinates are deliberately absent - the data set
                  records a country, not a point. */}
              <div className="footer-stamp" aria-hidden>
                <svg className="footer-globe" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="9" />
                  <ellipse cx="10" cy="10" rx="4" ry="9" />
                  <path d="M1 10h18M1.9 6h16.2M1.9 14h16.2" />
                </svg>
                <span className="footer-stamp-lines">
                  <span>{USER.timeZone}</span>
                  <span>{USER.address}</span>
                </span>
              </div>
            </div>
          </div>

          {/* The list itself is a client component: it owns the hover cards,
              so no element crosses into a Radix `Slot` from the server. */}
          <FooterTree label={<FooterLabel k="contact" />}>
            <FooterContactList github={github} />
          </FooterTree>

          <FooterTree label={<FooterLabel k="index" />}>
            <FooterIndexList links={INDEX_LINKS} />
          </FooterTree>
        </div>

        <div className="flex h-6" />
      </div>
    </footer>
  )
}

function FooterTree({
  label,
  children,
}: {
  label: React.ReactNode
  children: React.ReactNode
}) {
  // The `<ul>` is supplied by each caller rather than wrapped here, because the
  // contact column's list is rendered by a client component.
  return (
    <div className="footer-tree">
      <h2 className="footer-label">{label}</h2>
      {children}
    </div>
  )
}
