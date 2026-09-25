"use client"

import { compareDesc } from "date-fns"

import { CollapsibleList } from "@/components/collapsible-list"
import { SectionCallout } from "@/components/section-callout"
import { useTranslation } from "@/lib/i18n/use-translation"

import { AWARDS } from "../../data/awards"
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "../panel"
import { AwardItem } from "./award-item"

const SORTED_AWARDS = [...AWARDS].sort((a, b) => {
  return compareDesc(new Date(a.date), new Date(b.date))
})

export function Awards() {
  const { t } = useTranslation()

  return (
    <Panel id="awards">
      <SectionCallout side="right" className="top-10">
        {t.awards.callout}
      </SectionCallout>

      <PanelHeader>
        <PanelTitle>
          {t.awards.title}
          <PanelTitleSup>({AWARDS.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>

      <CollapsibleList
        items={SORTED_AWARDS}
        max={3}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <AwardItem award={item} />}
      />
    </Panel>
  )
}
