"use client"

import { useTranslation } from "@/lib/i18n/use-translation"

export function BlogEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-foreground">
        {t.blog.loadErrorTitle}
      </p>
      <p className="text-sm text-muted-foreground">
        {t.blog.loadErrorVisit}{" "}
        <a
          href="https://medium.com/@zickriann"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t.blog.loadErrorMedium}
        </a>{" "}
        {t.blog.loadErrorSuffix}
      </p>
    </div>
  )
}
