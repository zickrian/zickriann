import { ImageResponse } from "next/og"

import { SEO_LOGO_DATA_URI } from "./seo-logo-loader"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <img src={SEO_LOGO_DATA_URI} width={64} height={64} alt="" />,
    { ...size }
  )
}
