import fs from "node:fs"
import path from "node:path"

import sharp from "sharp"

/**
 * Loads the SEO logo from public/, converts it to a PNG buffer in-memory,
 * and exposes a base64 data URI.
 *
 * Why in-memory PNG conversion instead of shipping a PNG file:
 *   - next/og's ImageResponse uses Satori under the hood, which only accepts
 *     PNG/JPEG inputs (NOT WebP) for `<img src>` data URIs.
 *   - WebP assets are kept as the canonical files in /public.
 *   - Sharp converts the assets to PNG buffers once, when this module is first
 *     evaluated. The consumer routes are statically prerendered, so this runs
 *     once per build, never per request.
 *
 * Used by:
 *   - src/app/icon.tsx        (favicon 64x64)
 *   - src/app/apple-icon.tsx  (apple touch icon 180x180)
 *
 * Top-level await is required here for the sharp conversion. Next.js 16 +
 * Turbopack support TLA in ESM modules.
 */
const webpBuffer = fs.readFileSync(
  path.join(process.cwd(), "public/icons/seo.webp")
)

const pngBuffer = await sharp(webpBuffer)
  .resize({
    width: 256,
    height: 256,
    fit: "inside",
    withoutEnlargement: true,
  })
  .png({ compressionLevel: 9, quality: 90 })
  .toBuffer()

export const SEO_LOGO_DATA_URI = `data:image/png;base64,${pngBuffer.toString("base64")}`
