import { ImageResponse } from "next/og"

import { SEO_LOGO_DATA_URI } from "./seo-logo-loader"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <img src={SEO_LOGO_DATA_URI} width={180} height={180} alt="" />,
    { ...size }
  )
}
