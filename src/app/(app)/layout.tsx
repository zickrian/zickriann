import { ChatWidget } from "@/components/chat-widget"
import { PixelBlast } from "@/components/pixel-blast"
import { SiteFooter } from "@/components/site-footer"
import { PortfolioNavbar } from "@/features/portfolio/components/portfolio-navbar"
import { ProfileHeader } from "@/features/portfolio/components/profile-header"
import { getGitHubRepoStats } from "@/features/portfolio/data/github-repo"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const repoStats = await getGitHubRepoStats()

  return (
    // No padding reacts to the chat opening, on purpose: the panel occupies the
    // gutter beside the centred column rather than displacing it, so opening the
    // chat never moves a single thing on the page.
    <div className="group/layout relative">
      <PixelBlast />
      {/* Invisible until tabbed to. Without it, reaching the content by keyboard
          means walking the whole header and nav on every single page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-80 focus:rounded-lg focus:bg-popover focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring focus:outline-none"
      >
        Skip to content
      </a>

      <main className="max-w-screen overflow-x-clip sm:px-2">
        <div className="relative z-1 mx-auto bg-card md:max-w-[720px] *:[[id]]:scroll-mt-26">
          <ProfileHeader repoStats={repoStats} />
          <PortfolioNavbar className="h-14" />
          <div id="main" tabIndex={-1} className="outline-none">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />

      <ChatWidget />
    </div>
  )
}
