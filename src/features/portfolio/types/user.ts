export type User = {
  firstName: string
  lastName: string
  /** Preferred public-facing name */
  displayName: string
  /** Handle/username used in links or mentions */
  username: string
  gender: "male" | "female" | "non-binary"
  /** e.g. "he/him", "she/her", "they/them" */
  pronouns: string
  bio: string
  /** Indonesian translation of `bio`, used when the language preference is "id" */
  bioId?: string
  /** Short phrases shown under the name */
  flipSentences: string[]
  /** Indonesian translation of `flipSentences` */
  flipSentencesId?: string[]
  /** General location for display */
  address: string
  /** base64 encoded */
  email: string
  /** Phone number */
  phone?: string
  /** Personal/homepage URL */
  website: string
  /** Primary/current role shown on profile */
  jobTitle: string
  /** Short homepage title used for search/social snippets */
  seoTitle?: string
  /** Short homepage description used for search/social snippets */
  seoDescription?: string
  /** Work history entries */
  jobs: {
    title: string
    company: string
    website: string
    experienceId?: string
  }[]
  /** Rich about section; supports Markdown */
  about: string
  /** Indonesian translation of `about`; supports Markdown */
  aboutId?: string
  /** Public URL to avatar image */
  avatar: string
  /** Open Graph image URL for social sharing */
  ogImage: string
  /** Authoritative public profile URLs used for entity matching */
  sameAs: string[]
  /** SEO keywords list for metadata */
  keywords: string[]
  /** Time zone in IANA format */
  timeZone: string
  /** Profile/site start date in YYYY-MM-DD */
  dateCreated: string
  /** Last maintained profile metadata update in YYYY-MM-DD */
  dateModified: string
}
