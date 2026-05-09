import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ThemeId } from "../src/lib/card.ts";
import { splitPages, splitParagraphs, themeForPage, detectQABox } from "./lib/chunk.ts";
import { reportChunks, printReport } from "./lib/chunkReport.ts";

export type Chunk = {
  chunk_id: string;
  source: "livret" | "charte";
  page: number;
  theme: ThemeId;
  fr_a: string;
  fr_q?: string;
  verbatim_question?: boolean;
};

export async function extractSource(opts?: { root?: string }) {
  const root = opts?.root ?? process.cwd();
  const livretText = readFileSync(join(root, "raw/livret.txt"), "utf8");
  const charteText = readFileSync(join(root, "raw/charte.txt"), "utf8");

  const chunks: Chunk[] = [];
  let n = 0;

  function emit(c: Omit<Chunk, "chunk_id">) {
    n += 1;
    chunks.push({ chunk_id: `${c.theme}-raw-${String(n).padStart(3, "0")}`, ...c });
  }

  for (const page of splitPages(livretText)) {
    const theme = themeForPage("livret", page.page);
    if (!theme) continue;
    for (const para of splitParagraphs(page.text, 60)) {
      if (/^©/.test(para)) continue;
      if (/^\.{8,}/.test(para)) continue;
      if (/^[|\s\d]+$/.test(para)) continue;

      const qa = detectQABox(para);
      if (qa) {
        emit({
          source: "livret",
          page: page.page,
          theme,
          fr_q: qa.fr_q,
          fr_a: qa.fr_a,
          verbatim_question: true,
        });
      } else {
        emit({ source: "livret", page: page.page, theme, fr_a: para });
      }
    }
  }

  for (const page of splitPages(charteText)) {
    const theme = themeForPage("charte", page.page);
    if (!theme) continue;
    for (const para of splitParagraphs(page.text, 60)) {
      if (/^LIBERTÉ|^ÉGALITÉ|^FRATERNITÉ/.test(para)) continue;
      if (/^RÉPUBLIQUE FRANÇAISE$/.test(para)) continue;
      emit({ source: "charte", page: page.page, theme, fr_a: para });
    }
  }

  writeFileSync(join(root, "raw/chunks.json"), JSON.stringify(chunks, null, 2));
  return { chunks, count: chunks.length };
}

import { pathToFileURL } from "node:url";
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  extractSource()
    .then((r) => {
      console.log(`Extracted ${r.count} chunks → raw/chunks.json`);
      printReport(reportChunks(r.chunks));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
