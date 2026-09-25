export interface MediumPost {
  title: string
  link: string
  pubDate: string
  description: string
  thumbnail: string | null
  categories: string[]
  guid: string
}

function extractFirstImage(content: string): string | null {
  const match = content.match(/<img[^>]+src="([^"]+)"/i)
  return match ? match[1] : null
}

/**
 * The RSS content embeds Medium's 1024px thumbnail variant, but the cards
 * render it at ~104-128 CSS px. Fetching the 1024px file for a 128px slot
 * wastes tens of KB per post, so rewrite to the 256px variant (2x for
 * retina). URLs that are not Medium resized variants (`/max/<width>/`) are
 * left untouched.
 */
const THUMBNAIL_WIDTH = 256

function downscaleMediumThumbnail(src: string): string {
  return src.replace(/\/max\/\d+\//, `/max/${THUMBNAIL_WIDTH}/`)
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractCdataContent(str: string): string {
  const match = str.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i)
  return match ? match[1].trim() : str.trim()
}

/**
 * Exported for unit tests (pure, no I/O).
 */
export function parseMediumRss(xml: string): MediumPost[] {
  const items: MediumPost[] = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)

  for (const match of itemMatches) {
    const item = match[1]

    const titleRaw = item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ""
    const title = extractCdataContent(titleRaw)

    const linkRaw = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? ""
    const link = linkRaw.trim()

    const pubDateRaw = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? ""
    const pubDate = pubDateRaw.trim()

    const guidRaw = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1] ?? ""
    const guid = guidRaw.trim()

    const contentRaw =
      item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1] ?? ""
    const contentHtml = extractCdataContent(contentRaw)

    const paragraphs = [...contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripHtml(m[1]))
      .filter((text) => text.length > 20)

    const description =
      paragraphs.length > 0
        ? paragraphs.slice(0, 2).join(" ").slice(0, 240)
        : stripHtml(contentHtml).slice(0, 240)

    const thumbnailRaw = extractFirstImage(contentHtml)
    const thumbnail = thumbnailRaw
      ? downscaleMediumThumbnail(thumbnailRaw)
      : null

    const categoryMatches = [
      ...item.matchAll(/<category>([\s\S]*?)<\/category>/gi),
    ]
    const categories = categoryMatches.map((m) => extractCdataContent(m[1]))

    items.push({
      title,
      link,
      pubDate,
      description,
      thumbnail,
      categories,
      guid,
    })
  }

  return items
}

export async function fetchMediumPosts(): Promise<MediumPost[]> {
  try {
    const res = await fetch("https://medium.com/feed/@zickriann", {
      // Next.js Data Cache: revalidate every 30 min
      next: { revalidate: 1800 },
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; portfolio-blog-bot/1.0)",
      },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseMediumRss(xml)
  } catch {
    return []
  }
}
