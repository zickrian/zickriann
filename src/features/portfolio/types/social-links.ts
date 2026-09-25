export type SocialLink = {
  /** Monochrome icon element (rendered with currentColor for black & white). */
  icon: React.ReactNode
  title: string
  /** Optional handle/username or subtitle displayed under the title. */
  subtitle?: string
  /** External profile URL opened when the item is clicked. */
  href: string
}
