import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ReactMarkdown from "react-markdown"
import rehypeExternalLinks from "rehype-external-links"
import remarkGfm from "remark-gfm"
import { describe, expect, it } from "vitest"

import { AWARDS } from "@/features/portfolio/data/awards"
import { EXPERIENCES } from "@/features/portfolio/data/experiences"
import { PROJECTS } from "@/features/portfolio/data/projects"
import { USER } from "@/features/portfolio/data/user"

import { Markdown } from "./markdown"

// react-markdown separates block elements with newlines; the local renderer
// does not. Neither renders, so both sides are compared without them.
const normalize = (html: string) => html.replace(/>\n+</g, "><").trim()

function renderReference(source: string) {
  return normalize(
    renderToStaticMarkup(
      React.createElement(
        ReactMarkdown,
        {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            [
              rehypeExternalLinks,
              { target: "_blank", rel: ["nofollow", "noopener", "noreferrer"] },
            ],
          ],
        },
        source
      )
    )
  )
}

const renderLocal = (source: string) =>
  normalize(renderToStaticMarkup(React.createElement(Markdown, null, source)))

const FIXTURES = [
  "A single plain paragraph.",
  "- One bullet\n- Two **bold** words\n- Three",
  "Lead paragraph.\n\n- Bullet with **bold – dash** (parens).\n- Certificate No: ABC/123.",
  "Line one\nline two soft-wrapped.",
  "Mixing *emphasis*, **strong** and `code` inline.",
  "A [labelled link](https://example.com) inside a sentence.",
]

const isFilled = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0

const CONTENT: string[] = [
  ...[USER.about, USER.aboutId].filter(isFilled),
  ...AWARDS.flatMap((award) =>
    [award.description, award.descriptionId].filter(isFilled)
  ),
  ...EXPERIENCES.flatMap((experience) =>
    experience.positions.flatMap((position) =>
      [position.description, position.descriptionId].filter(isFilled)
    )
  ),
  ...PROJECTS.flatMap((project) =>
    [project.notes, project.notesId].filter(isFilled)
  ),
]

describe("Markdown", () => {
  it.each(FIXTURES)("matches react-markdown for %j", (source) => {
    expect(renderLocal(source)).toBe(renderReference(source))
  })

  it("matches react-markdown for every string the site renders", () => {
    expect(CONTENT.length).toBeGreaterThan(30)
    for (const source of CONTENT) {
      expect(renderLocal(source), source.slice(0, 60)).toBe(
        renderReference(source)
      )
    }
  })

  it("renders nothing for empty input", () => {
    expect(renderLocal("")).toBe("")
  })
})
