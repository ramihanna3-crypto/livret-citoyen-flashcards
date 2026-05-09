import type { ThemeId } from "../../src/lib/card.ts";

export type Page = { page: number; text: string };
export type Source = "livret" | "charte";

export function splitPages(raw: string): Page[] {
  const out: Page[] = [];
  const lines = raw.split(/\r?\n/);
  let current: Page | null = null;
  for (const line of lines) {
    const m = line.match(/^=====\s*PAGE\s+(\d+)\s*=====\s*$/);
    if (m) {
      if (current) {
        current.text = current.text.trim();
        out.push(current);
      }
      current = { page: Number(m[1]), text: "" };
    } else if (current) {
      current.text += line + "\n";
    }
  }
  if (current) {
    current.text = current.text.trim();
    out.push(current);
  }
  return out;
}

export function splitParagraphs(text: string, minLen = 1): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= minLen);
}

const LIVRET_RANGES: Array<{ start: number; end: number; theme: ThemeId | null }> = [
  { start: 1, end: 3, theme: null }, // cover, table of contents, avant-propos
  { start: 4, end: 7, theme: "valeurs" }, // pp.4–7 valeurs & laïcité
  { start: 8, end: 8, theme: "droits-devoirs" }, // p.8 droits & devoirs (Livret part)
  { start: 9, end: 11, theme: "institutions" }, // pp.9–11 institutions + collectivités
  { start: 12, end: 19, theme: "histoire" }, // pp.12–19 histoire
  { start: 20, end: 23, theme: "geographie" }, // pp.20–23 europe + caractéristiques + carte
  { start: 24, end: 25, theme: "ddhc" }, // pp.24–25 DDHC articles
  { start: 26, end: 28, theme: null }, // notes, back cover
];

export function themeForPage(source: Source, page: number): ThemeId | null {
  if (source === "charte") return "droits-devoirs";
  for (const r of LIVRET_RANGES) {
    if (page >= r.start && page <= r.end) return r.theme;
  }
  return null;
}

// Detect Q&A "boxes" — the 8 colored sidebars in the Livret.
// They follow the pattern: a paragraph ending with "?" followed (in the next paragraph) by a sentence.
// In the extracted text these collapse to: "Question text ?\nAnswer text..."
export function detectQABox(paragraph: string): { fr_q: string; fr_a: string } | null {
  const trimmed = paragraph.trim();
  if (trimmed.length > 1200) return null;
  const m = trimmed.match(/^(.+?\?)\s+([A-ZÀ-Ý].*)$/s);
  if (!m) return null;
  const fr_q = m[1].trim();
  const fr_a = m[2].trim();
  if (fr_q.length < 8 || fr_a.length < 10) return null;
  if (
    !/^(Avez|Pourquoi|Quelle|Quel|Que |Qu['`]|Comment|Quand|Qui |L'administration|Tout |Un |Une )/i.test(
      fr_q,
    )
  ) {
    return null;
  }
  return { fr_q, fr_a };
}
