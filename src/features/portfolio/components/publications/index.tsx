"use client"

import { useTranslation } from "@/lib/i18n/use-translation"

import { PUBLICATIONS } from "../../data/publications"
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "../panel"
import { PublicationItem } from "./publication-item"

export function Publications() {
  const { t } = useTranslation()

  return (
    <Panel id="publications">
      <PanelHeader>
        <PanelTitle>
          {t.publications.title}
          <PanelTitleSup>({PUBLICATIONS.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>

      <div className="divide-y divide-line">
        {PUBLICATIONS.map((pub) => (
          <PublicationItem key={pub.id} publication={pub} />
        ))}
      </div>
    </Panel>
  )
}
