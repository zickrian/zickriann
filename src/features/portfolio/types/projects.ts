export type ProjectCollaboration = {
  ownership: string
  /** Indonesian translation of `ownership` */
  ownershipId?: string
  label: string
  team: string
  role: string
  /** Indonesian translation of `role` */
  roleId?: string
  contributions: string[]
  /** Indonesian translation of `contributions` */
  contributionsId?: string[]
}

export type ProjectLinks = {
  live?: string
  repo?: string
}

export type ProjectVideoEmbed = {
  src: string
  title: string
}

export type Project = {
  /** Stable unique identifier used as the detail route slug. */
  id: string
  title: string
  category: string
  /** Indonesian translation of `category` */
  categoryId?: string
  tagline: string
  /** Indonesian translation of `tagline` */
  taglineId?: string
  /** Short search/social snippet. Falls back to tagline when omitted. */
  seoDescription?: string
  /** Concise SEO title (50-60 chars max). Falls back to title when omitted. */
  seoTitle?: string
  year: "2025" | "2026"
  /** Local image URL under /public used in cards and case-study hero. */
  image: string
  /** Optional monochrome icon/logo URL under /public shown beside the project in the portfolio list. Rendered in black & white. */
  logo?: string
  /** Optional video embed shown in the case-study media area. */
  videoEmbed?: ProjectVideoEmbed
  /** Project period for compact portfolio list display. */
  period: {
    start: string
    end?: string
  }
  /** Primary public URL. */
  link: string
  links: ProjectLinks
  skills: string[]
  /** Short stack highlights shown on project cards. */
  coverSkills?: string[]
  features: string[]
  /** Indonesian translation of `features` */
  featuresId?: string[]
  impact: string[]
  /** Indonesian translation of `impact` */
  impactId?: string[]
  collaboration: ProjectCollaboration
  /** Optional rich description; Markdown and line breaks supported. */
  description?: string
  /** Optional notes such as demo credentials or access restrictions. */
  notes?: string
  /** Indonesian translation of `notes` */
  notesId?: string
  /** Whether the project card is expanded by default in legacy UI. */
  isExpanded?: boolean
  /** Optional highlight badge (e.g. "Top 5 Finalist") */
  badge?: string
  /** Indonesian translation of `badge` */
  badgeId?: string
  /** Optional gallery images for carousel in detail page */
  gallery?: string[]
}
