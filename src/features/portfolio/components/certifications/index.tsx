"use client"

import { CollapsibleList } from "@/components/collapsible-list"
import { useTranslation } from "@/lib/i18n/use-translation"

import { CERTIFICATIONS } from "../../data/certifications"
import { Panel, PanelHeader, PanelTitle, PanelTitleSup } from "../panel"
import { CertificationItem } from "./certification-item"

export function Certifications() {
  const { t } = useTranslation()

  return (
    <Panel id="certs">
      <PanelHeader>
        <PanelTitle>
          {t.certifications.title}
          <PanelTitleSup>({CERTIFICATIONS.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>

      <CollapsibleList
        items={CERTIFICATIONS}
        max={3}
        renderItem={(item) => <CertificationItem certification={item} />}
      />
    </Panel>
  )
}
