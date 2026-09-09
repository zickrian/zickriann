"use client"

import Link from "next/link"

import { useIntentPrefetch } from "@/hooks/use-intent-prefetch"
import { useTranslation } from "@/lib/i18n/use-translation"

const INDEX_LABEL_KEYS: Record<string, "home" | "projects" | "blog" | "gallery"> = {
  "/": "home",
  "/projects": "projects",
  "/blog": "blog",
  "/gallery": "gallery",
}

export function FooterLabel({ k }: { k: "contact" | "index" }) {
  const { t } = useTranslation()
  return <>{t.footer[k]}</>
}

export function FooterIndexList({
  links,
}: {
  links: { title: string; href: string }[]
}) {
  const { t } = useTranslation()

  return (
    <ul>
      {links.map(({ title, href }) => (
        <li key={href}>
          <FooterIndexLink href={href}>
            {INDEX_LABEL_KEYS[href] ? t.nav[INDEX_LABEL_KEYS[href]] : title}
          </FooterIndexLink>
        </li>
      ))}
    </ul>
  )
}

function FooterIndexLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const intentPrefetch = useIntentPrefetch(href)

  return (
    <Link
      href={href}
      prefetch={false}
      {...intentPrefetch}
      className="inline-flex w-fit transition-[color] hover:text-foreground"
    >
      {children}
    </Link>
  )
}
