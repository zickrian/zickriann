/**
 * Latin letters as braille cells.
 *
 * Used purely as dot texture - a printer's mark under the footer colophon. The
 * readable name sits directly above it, so anything unmappable is dropped
 * rather than substituted with a placeholder glyph.
 *
 * Adapted from cali.so (MIT, © Cali Castle).
 */
const CELLS: Record<string, string> = {
  a: "⠁",
  b: "⠃",
  c: "⠉",
  d: "⠙",
  e: "⠑",
  f: "⠋",
  g: "⠛",
  h: "⠓",
  i: "⠊",
  j: "⠚",
  k: "⠅",
  l: "⠇",
  m: "⠍",
  n: "⠝",
  o: "⠕",
  p: "⠏",
  q: "⠟",
  r: "⠗",
  s: "⠎",
  t: "⠞",
  u: "⠥",
  v: "⠧",
  w: "⠺",
  x: "⠭",
  y: "⠽",
  z: "⠵",
}

/** U+2800 BRAILLE PATTERN BLANK - a word gap that keeps the cell rhythm. */
const BLANK = "⠀"

export function brailleText(text: string): string {
  return [...text.toLowerCase()]
    .map((char) => (char === " " ? BLANK : (CELLS[char] ?? "")))
    .join("")
}
