import type { Chunk } from "../extract-source.ts";

export type Report = {
  total: number;
  verbatim: number;
  byTheme: Record<string, number>;
};

export function reportChunks(chunks: Chunk[]): Report {
  const r: Report = { total: chunks.length, verbatim: 0, byTheme: {} };
  for (const c of chunks) {
    if (c.verbatim_question) r.verbatim++;
    r.byTheme[c.theme] = (r.byTheme[c.theme] ?? 0) + 1;
  }
  return r;
}

export function printReport(r: Report) {
  console.log(`  Total chunks:     ${r.total}`);
  console.log(`  Verbatim Q&A:     ${r.verbatim}`);
  console.log(`  By theme:`);
  for (const [t, n] of Object.entries(r.byTheme).sort()) {
    console.log(`    ${t.padEnd(18)} ${n}`);
  }
}
