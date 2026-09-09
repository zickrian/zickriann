import React from "react"

/**
 * Minimal CommonMark + GFM-autolink renderer for the site's own copy.
 *
 * `react-markdown` + `remark-gfm` + `rehype-raw` cost ~360 KB of client JS
 * (micromark plus the whole parse5 HTML parser) and shipped on the home page
 * because every consumer here is a client component. The content it rendered
 * is authored in this repo and only uses paragraphs, tight `-` lists, inline
 * emphasis and autolinks, so it is parsed here instead. Output is React
 * elements - never raw HTML - so nothing can inject markup.
 * `markdown.test.ts` asserts byte-identical output against react-markdown for
 * every string the site actually renders.
 *
 * The chat widget keeps `react-markdown`: it renders untrusted model output and
 * already lives in a lazily loaded chunk.
 */

const STRONG = /^(\*\*|__)(?=\S)([\s\S]*?\S)\1/
const EMPHASIS = /^(\*|_)(?=\S)([\s\S]*?\S)\1/
const CODE = /^`([^`]+)`/
const LINK = /^\[([^\]]*)\]\(([^\s)]*)\)/
const URL_AUTOLINK = /^https?:\/\/[^\s<]+/
const EMAIL_AUTOLINK = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/
// GFM drops these when they trail an autolink, so `(a@b.com),` links only the address.
const TRAILING_PUNCTUATION = /[.,:;!?*_~]+$/

function externalLinkProps(href: string) {
  return /^https?:\/\//.test(href)
    ? { rel: "nofollow noopener noreferrer", target: "_blank" }
    : {}
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let plain = ""
  let cursor = 0
  let key = 0

  const flush = () => {
    if (plain) nodes.push(plain)
    plain = ""
  }

  const push = (node: React.ReactNode) => {
    flush()
    nodes.push(node)
  }

  while (cursor < text.length) {
    const rest = text.slice(cursor)
    const char = text[cursor]

    if (char === "*" || char === "_") {
      const strong = STRONG.exec(rest)
      if (strong) {
        const id = `${keyPrefix}-${key++}`
        push(<strong key={id}>{renderInline(strong[2], id)}</strong>)
        cursor += strong[0].length
        continue
      }
      const emphasis = EMPHASIS.exec(rest)
      if (emphasis) {
        const id = `${keyPrefix}-${key++}`
        push(<em key={id}>{renderInline(emphasis[2], id)}</em>)
        cursor += emphasis[0].length
        continue
      }
    }

    if (char === "`") {
      const code = CODE.exec(rest)
      if (code) {
        push(<code key={`${keyPrefix}-${key++}`}>{code[1]}</code>)
        cursor += code[0].length
        continue
      }
    }

    if (char === "[") {
      const link = LINK.exec(rest)
      if (link) {
        const id = `${keyPrefix}-${key++}`
        push(
          <a key={id} href={link[2]} {...externalLinkProps(link[2])}>
            {renderInline(link[1], id)}
          </a>
        )
        cursor += link[0].length
        continue
      }
    }

    // Autolinks only start at a word boundary, matching GFM.
    if (cursor === 0 || /[\s(<*_~]/.test(text[cursor - 1] ?? "")) {
      const url = URL_AUTOLINK.exec(rest)?.[0]?.replace(TRAILING_PUNCTUATION, "")
      if (url) {
        push(
          <a
            key={`${keyPrefix}-${key++}`}
            href={url}
            {...externalLinkProps(url)}
          >
            {url}
          </a>
        )
        cursor += url.length
        continue
      }

      const email = EMAIL_AUTOLINK.exec(rest)?.[0]?.replace(/[.\-_]+$/, "")
      if (email) {
        push(
          <a key={`${keyPrefix}-${key++}`} href={`mailto:${email}`}>
            {email}
          </a>
        )
        cursor += email.length
        continue
      }
    }

    plain += char
    cursor += 1
  }

  flush()
  return nodes
}

type Block =
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; items: string[] }

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = []
  let openParagraph: Block | null = null

  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line)

    if (bullet) {
      openParagraph = null
      const last = blocks.at(-1)
      if (last?.type === "list") last.items.push(bullet[1])
      else blocks.push({ type: "list", items: [bullet[1]] })
      continue
    }

    if (line.trim() === "") {
      openParagraph = null
      continue
    }

    if (openParagraph?.type === "paragraph") {
      openParagraph.lines.push(line)
    } else {
      openParagraph = { type: "paragraph", lines: [line] }
      blocks.push(openParagraph)
    }
  }

  return blocks
}

export function Markdown({ children }: { children?: string | null }) {
  const source = typeof children === "string" ? children : ""
  if (!source.trim()) return null

  return (
    <>
      {parseBlocks(source).map((block, blockIndex) =>
        block.type === "list" ? (
          <ul key={blockIndex}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                {renderInline(item, `${blockIndex}-${itemIndex}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p key={blockIndex}>
            {renderInline(block.lines.join("\n"), String(blockIndex))}
          </p>
        )
      )}
    </>
  )
}
