# Livret du Citoyen — Content Pipeline & Audio Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the offline tooling that converts the Ministère de l'Intérieur PDFs into a complete bilingual flashcard corpus with French audio. Implementation tasks build and test the scripts with mocked API responses; the user runs the finished pipeline once with their own API keys.

**Architecture:** Three CLI scripts under `scripts/`. (1) `extract-source.ts` chops `raw/livret.txt` and `raw/charte.txt` into atomic, theme-tagged chunks and detects the 8 official Q&A boxes verbatim. (2) `draft-cards.ts` calls the Anthropic API to produce Arabic translations and French questions, writing draft JSON to `data/cards-draft/`. (3) `build-audio.ts` calls ElevenLabs to produce content-addressed MP3s under `public/audio/<sha1>.mp3` and rewrites the card JSON `audio` fields with real hashes. All scripts are idempotent: re-running them only does work for content that changed.

**Tech Stack:** tsx (already installed), Anthropic SDK (`@anthropic-ai/sdk`), native `fetch` for ElevenLabs, Node's `crypto` for sha1, Node's `fs/promises`, the existing `Card`/`CardArray` Zod schema from `src/lib/card.ts`. Tests use Vitest with mocked SDK and fetch.

**Source spec:** `docs/superpowers/specs/2026-05-08-livret-citoyen-flashcards-design.md` (sections §7 authoring pipeline, §8 audio pipeline).

**Predecessor:** This plan extends the merged Plan 1 (`docs/superpowers/plans/2026-05-08-livret-citoyen-app.md`). Plan 1 shipped the deployable web app with 18 hand-authored fixture cards. Plan 2 replaces those fixtures with the real ~85–112 card corpus plus all French audio.

---

## Phase organization

| Phase                         | Tasks | Delivers                                                                                                           |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| 1. Environment & deps         | 1–2   | `.env.example`, `dotenv` loader, Anthropic SDK installed, `node-fetch` (or native fetch), Zod available to scripts |
| 2. Source extraction          | 3–5   | `extract-source.ts` produces `raw/chunks.json` from livret + charte; verbatim Q&A boxes flagged                    |
| 3. AI drafting                | 6–8   | `draft-cards.ts` produces 6 theme JSON files in `data/cards-draft/` with French questions + Arabic translations    |
| 4. Audio generation           | 9–11  | `build-audio.ts` produces content-addressed MP3s and rewrites real sha1s into card JSONs                           |
| 5. User runbook + integration | 12–14 | `docs/RUNBOOK-PLAN-2.md`, replace fixture cards with real corpus, drop `SKIP_AUDIO_CHECK` from CI                  |

Total: **14 tasks.** Engineers run tasks 1–11 with mocked APIs (no real keys needed). Task 12 is a documentation deliverable. Tasks 13–14 are flipped on by the user after they have run the pipeline locally with real keys.

---

# Phase 1 — Environment & dependencies

### Task 1: `.env.example` + dotenv loader

**Files:**

- Create: `.env.example`, `scripts/lib/env.ts`
- Modify: `.gitignore` (verify `.env`, `.env.local` already ignored from Plan 1; add if missing), `package.json` (add `dotenv` devDep)

- [ ] **Step 1: Install dotenv.**

```bash
pnpm add -D dotenv
```

- [ ] **Step 2: Create `.env.example` at project root.**

```
# Copy this file to .env.local and fill in your keys.
# .env.local is git-ignored and never committed.

# --- Anthropic API (used by scripts/draft-cards.ts) ---
# Create at https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# Claude model to use for translations. Default works well; override if you want.
ANTHROPIC_MODEL=claude-sonnet-4-6

# --- ElevenLabs API (used by scripts/build-audio.ts) ---
# Sign up at https://elevenlabs.io and create an API key.
ELEVENLABS_API_KEY=...

# Voice ID — pick from https://elevenlabs.io/app/voice-library after sign-in.
# The default below is "Charlotte" (multilingual, clear French). Replace with your choice.
ELEVENLABS_VOICE_ID=XB0fDUnXU5powFXDhCwa

# Model — eleven_multilingual_v2 supports French and is the recommended default.
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

- [ ] **Step 3: Verify `.gitignore` already has `.env`, `.env.local`, `.env.*.local`.**

If they are missing, add them. (Plan 1 already added these.)

- [ ] **Step 4: Create `scripts/lib/env.ts`.**

```ts
import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(`✗ Missing required env var: ${name}`);
    console.error("  Copy .env.example → .env.local and fill in your keys.");
    process.exit(1);
  }
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  anthropicKey: () => required("ANTHROPIC_API_KEY"),
  anthropicModel: () => optional("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
  elevenLabsKey: () => required("ELEVENLABS_API_KEY"),
  elevenLabsVoiceId: () => required("ELEVENLABS_VOICE_ID"),
  elevenLabsModelId: () => optional("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2"),
};
```

`required()` is lazy — it only throws when actually called, so unit tests that don't touch the API never need keys.

- [ ] **Step 5: Verify `pnpm dev` and `pnpm build` still work** (the new file is isolated under `scripts/lib/`, no risk of import side effects).

```bash
pnpm typecheck
pnpm test
pnpm build
```

All clean.

- [ ] **Step 6: Commit.**

```bash
git add .env.example scripts/lib/env.ts .gitignore package.json pnpm-lock.yaml
git commit -m "chore: add .env.example and env loader for content pipeline scripts"
```

---

### Task 2: Install Anthropic SDK + add the script entries to `package.json`

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install the Anthropic SDK.**

```bash
pnpm add -D @anthropic-ai/sdk
```

- [ ] **Step 2: Add the four pipeline scripts to `package.json` (placeholders that point to files we'll create in Phase 2–4).**

Add to the `scripts` block (preserve existing entries):

```json
"extract:source": "tsx scripts/extract-source.ts",
"draft:cards": "tsx scripts/draft-cards.ts",
"build:audio": "tsx scripts/build-audio.ts"
```

(`validate:cards` already exists from Plan 1.)

- [ ] **Step 3: Verify the SDK is importable.**

```bash
pnpm exec tsx -e "import Anthropic from '@anthropic-ai/sdk'; console.log(typeof Anthropic);"
```

Expected: `function`.

- [ ] **Step 4: Commit.**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install @anthropic-ai/sdk and register pipeline npm scripts"
```

---

# Phase 2 — Source extraction

### Task 3: Chunk types + page-tagged paragraph splitter

**Files:**

- Create: `scripts/lib/chunk.ts`, `scripts/lib/chunk.test.ts`

- [ ] **Step 1: Failing test at `scripts/lib/chunk.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { splitPages, splitParagraphs, themeForPage } from "./chunk";

describe("splitPages", () => {
  it("groups text by '===== PAGE N =====' markers", () => {
    const raw = "\n===== PAGE 1 =====\nfoo\nbar\n\n===== PAGE 2 =====\nbaz";
    const pages = splitPages(raw);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toEqual({ page: 1, text: "foo\nbar" });
    expect(pages[1]).toEqual({ page: 2, text: "baz" });
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines and trims", () => {
    expect(splitParagraphs("foo\nbar\n\nbaz\n\n   \n\nqux")).toEqual(["foo\nbar", "baz", "qux"]);
  });
  it("drops paragraphs shorter than minLen", () => {
    expect(splitParagraphs("ok\n\nA\n\nlong enough text", 5)).toEqual(["long enough text"]);
  });
});

describe("themeForPage", () => {
  it("maps livret pages to themes per spec §7.1", () => {
    expect(themeForPage("livret", 4)).toBe("valeurs");
    expect(themeForPage("livret", 7)).toBe("valeurs"); // 7 boundary: still valeurs (laïcité)
    expect(themeForPage("livret", 8)).toBe("droits-devoirs");
    expect(themeForPage("livret", 11)).toBe("institutions");
    expect(themeForPage("livret", 16)).toBe("histoire");
    expect(themeForPage("livret", 22)).toBe("geographie");
    expect(themeForPage("livret", 24)).toBe("ddhc");
    expect(themeForPage("livret", 25)).toBe("ddhc");
  });
  it("returns null for cover/blank pages", () => {
    expect(themeForPage("livret", 1)).toBeNull();
    expect(themeForPage("livret", 27)).toBeNull();
  });
  it("maps charte page 1 to droits-devoirs", () => {
    expect(themeForPage("charte", 1)).toBe("droits-devoirs");
    expect(themeForPage("charte", 2)).toBe("droits-devoirs");
  });
});
```

The relative `./chunk` import works because both files live in `scripts/lib/`. Vite's `@` alias still points to `src/`; tests in `scripts/` use relative imports for sibling modules.

- [ ] **Step 2: Add a Vitest `include` for scripts.**

In `vite.config.ts`, change the `test.include` value to:

```ts
include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.ts"],
```

(All other config stays the same.)

- [ ] **Step 3: Run the test — it fails (module missing).**

```bash
pnpm test scripts/lib/chunk.test.ts
```

- [ ] **Step 4: Implement `scripts/lib/chunk.ts`.**

```ts
import type { ThemeId } from "../../src/lib/card.ts";

export type Page = { page: number; text: string };
export type Source = "livret" | "charte";

const PAGE_MARK = /^=====\s*PAGE\s+(\d+)\s*=====\s*$/m;

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
// We use a heuristic: paragraph contains a sentence ending in "?" early on,
// has a clear period or sentence following, and overall length is < 1000 chars.
export function detectQABox(paragraph: string): { fr_q: string; fr_a: string } | null {
  const trimmed = paragraph.trim();
  if (trimmed.length > 1200) return null;
  // Find the first "?" that is not inside quotes and is followed by whitespace + capital letter.
  const m = trimmed.match(/^(.+?\?)\s+([A-ZÀ-Ý].*)$/s);
  if (!m) return null;
  const fr_q = m[1].trim();
  const fr_a = m[2].trim();
  if (fr_q.length < 8 || fr_a.length < 10) return null;
  // Question must be a real question — at least one of the typical interrogative words.
  if (
    !/^(Avez|Pourquoi|Quelle|Quel|Que|Qu['`]|Comment|Quand|Qui|L'administration|Tout|Un|Une)/i.test(
      fr_q,
    )
  ) {
    return null;
  }
  return { fr_q, fr_a };
}
```

- [ ] **Step 5: Run the tests — they pass.**

```bash
pnpm test scripts/lib/chunk.test.ts
```

- [ ] **Step 6: Commit.**

```bash
git add scripts/lib/chunk.ts scripts/lib/chunk.test.ts vite.config.ts
git commit -m "feat: chunk helpers — splitPages, splitParagraphs, themeForPage, detectQABox"
```

---

### Task 4: `extract-source.ts` end-to-end

**Files:**

- Create: `scripts/extract-source.ts`, `scripts/extract-source.test.ts`
- Modify: `package.json` (verify Task 2 already added the script)

- [ ] **Step 1: Failing test at `scripts/extract-source.test.ts`.**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { extractSource } from "./extract-source";

const TMP = join(process.cwd(), "tmp-extract-test");

beforeEach(() => {
  mkdirSync(join(TMP, "raw"), { recursive: true });
  writeFileSync(
    join(TMP, "raw", "livret.txt"),
    [
      "===== PAGE 4 =====",
      "Avez-vous le droit de tout dire publiquement ?",
      "Oui, la liberté d'expression est un droit fondamental. Elle a des limites.",
      "",
      "La République est une démocratie",
      "Le Président de la République est élu au suffrage universel.",
      "",
      "===== PAGE 24 =====",
      "Art. 1er. Les hommes naissent et demeurent libres et égaux en droits.",
    ].join("\n"),
  );
  writeFileSync(
    join(TMP, "raw", "charte.txt"),
    [
      "===== PAGE 1 =====",
      "RÉPUBLIQUE FRANÇAISE",
      "CHARTE DES DROITS ET DEVOIRS DU CITOYEN FRANÇAIS",
      "",
      "Le peuple français se reconnaît dans la Déclaration des droits de l'homme.",
    ].join("\n"),
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("extractSource", () => {
  it("emits chunks tagged by theme and source", async () => {
    const { chunks } = await extractSource({ root: TMP });
    expect(chunks.length).toBeGreaterThan(0);
    const themes = new Set(chunks.map((c) => c.theme));
    expect(themes.has("valeurs")).toBe(true);
    expect(themes.has("ddhc")).toBe(true);
    expect(themes.has("droits-devoirs")).toBe(true);
  });

  it("flags official Q&A boxes with verbatim_question", async () => {
    const { chunks } = await extractSource({ root: TMP });
    const qa = chunks.find((c) => c.verbatim_question === true);
    expect(qa).toBeDefined();
    expect(qa!.fr_q).toMatch(/Avez-vous le droit de tout dire/);
    expect(qa!.fr_a).toMatch(/liberté d'expression/);
  });

  it("writes chunks.json to raw/ with stable structure", async () => {
    await extractSource({ root: TMP });
    const path = join(TMP, "raw", "chunks.json");
    expect(existsSync(path)).toBe(true);
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty("chunk_id");
    expect(parsed[0]).toHaveProperty("theme");
    expect(parsed[0]).toHaveProperty("source");
    expect(parsed[0]).toHaveProperty("fr_a");
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement `scripts/extract-source.ts`.**

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ThemeId } from "../src/lib/card.ts";
import { splitPages, splitParagraphs, themeForPage, detectQABox } from "./lib/chunk.ts";

export type Chunk = {
  chunk_id: string;
  source: "livret" | "charte";
  page: number;
  theme: ThemeId;
  fr_a: string; // verbatim paragraph text
  fr_q?: string; // present only when verbatim_question is true
  verbatim_question?: boolean; // true → 8 official Livret Q&A boxes
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
      // Skip obvious non-content lines: image captions starting with ©, dotted-line form fields, etc.
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

if (import.meta.url === `file://${process.argv[1]}`) {
  extractSource()
    .then((r) => console.log(`Extracted ${r.count} chunks → raw/chunks.json`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run tests — pass.**

```bash
pnpm test scripts/extract-source.test.ts
```

- [ ] **Step 5: Smoke-run the actual script against the real PDFs.**

```bash
pnpm extract:source
```

Expected output: `Extracted N chunks → raw/chunks.json` where N is roughly 80–130. Inspect `raw/chunks.json` briefly:

```bash
node -e "console.log(Object.entries(require('./raw/chunks.json').reduce((a,c)=>{a[c.theme]=(a[c.theme]||0)+1;return a;},{})))"
```

Should show 6 themes with reasonable per-theme counts (~10–25 each). The `verbatim_question` flag should appear on roughly 6–10 chunks.

- [ ] **Step 6: Commit (script + raw/chunks.json so we have a checkpoint).**

```bash
git add scripts/extract-source.ts scripts/extract-source.test.ts raw/chunks.json
git commit -m "feat: extract-source.ts — chunk PDFs into theme-tagged paragraphs"
```

---

### Task 5: Per-theme chunk counts + sanity sanity-check report

**Files:**

- Create: `scripts/lib/chunkReport.ts`, `scripts/lib/chunkReport.test.ts`
- Modify: `scripts/extract-source.ts` (add report at end)

- [ ] **Step 1: Failing test at `scripts/lib/chunkReport.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { reportChunks } from "./chunkReport";

describe("reportChunks", () => {
  it("returns per-theme + total + verbatim count", () => {
    const r = reportChunks([
      {
        chunk_id: "valeurs-raw-001",
        source: "livret",
        page: 4,
        theme: "valeurs",
        fr_a: "x",
        verbatim_question: true,
        fr_q: "?",
      },
      { chunk_id: "valeurs-raw-002", source: "livret", page: 4, theme: "valeurs", fr_a: "y" },
      { chunk_id: "histoire-raw-001", source: "livret", page: 12, theme: "histoire", fr_a: "z" },
    ]);
    expect(r.total).toBe(3);
    expect(r.verbatim).toBe(1);
    expect(r.byTheme.valeurs).toBe(2);
    expect(r.byTheme.histoire).toBe(1);
  });
});
```

- [ ] **Step 2: Implement `scripts/lib/chunkReport.ts`.**

```ts
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
```

- [ ] **Step 3: Wire it into `scripts/extract-source.ts`.**

At the bottom of `extractSource()`, just before `return`:

```ts
import { reportChunks, printReport } from "./lib/chunkReport.ts";
```

(Add to the imports at the top.)

And inside the `if (import.meta.url === ...)` CLI block, after `console.log("Extracted ...")`:

```ts
const report = reportChunks(r.chunks);
printReport(report);
```

(Inline the change minimally; preserve the existing logic.)

- [ ] **Step 4: Run tests + smoke run.**

```bash
pnpm test scripts/lib/chunkReport.test.ts
pnpm extract:source
```

The CLI now prints a per-theme breakdown.

- [ ] **Step 5: Commit.**

```bash
git add scripts/lib/chunkReport.ts scripts/lib/chunkReport.test.ts scripts/extract-source.ts
git commit -m "feat: per-theme chunk count report on extract-source"
```

---

# Phase 3 — AI drafting

### Task 6: Anthropic translator wrapper (mocked)

**Files:**

- Create: `scripts/lib/translator.ts`, `scripts/lib/translator.test.ts`

- [ ] **Step 1: Failing test at `scripts/lib/translator.test.ts`.**

```ts
import { describe, it, expect, vi } from "vitest";
import { translateChunk } from "./translator";

describe("translateChunk", () => {
  it("requests structured JSON from the model and returns ar_q + ar_a + fr_q (when not verbatim)", async () => {
    const messages = vi.fn().mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "emit_card",
          input: {
            fr_q: "Quelle est la devise de la République ?",
            ar_q: "ما هو شعار الجمهورية؟",
            ar_a: "تكفل الجمهورية الحرية والمساواة والإخاء.",
          },
        },
      ],
    });
    const fakeClient = { messages: { create: messages } };

    const out = await translateChunk(
      // @ts-expect-error -- duck-typed test client
      fakeClient,
      "claude-sonnet-4-6",
      {
        chunk_id: "valeurs-raw-001",
        theme: "valeurs",
        source: "livret",
        page: 4,
        fr_a: "La République garantit la liberté, l'égalité et la fraternité.",
      },
    );

    expect(messages).toHaveBeenCalledOnce();
    expect(out).toEqual({
      fr_q: "Quelle est la devise de la République ?",
      ar_q: "ما هو شعار الجمهورية؟",
      ar_a: "تكفل الجمهورية الحرية والمساواة والإخاء.",
    });
  });

  it("preserves the verbatim French question when the chunk is a Ministry Q&A box", async () => {
    const messages = vi.fn().mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "emit_card",
          input: {
            ar_q: "هل يحق لك قول كل شيء؟",
            ar_a: "نعم، حرية التعبير حق أساسي.",
          },
        },
      ],
    });
    const fakeClient = { messages: { create: messages } };

    const out = await translateChunk(
      // @ts-expect-error -- duck-typed test client
      fakeClient,
      "claude-sonnet-4-6",
      {
        chunk_id: "valeurs-raw-001",
        theme: "valeurs",
        source: "livret",
        page: 4,
        fr_a: "Oui, la liberté d'expression est un droit fondamental.",
        fr_q: "Avez-vous le droit de tout dire publiquement ?",
        verbatim_question: true,
      },
    );

    expect(out.fr_q).toBe("Avez-vous le droit de tout dire publiquement ?");
    expect(out.ar_q).toBe("هل يحق لك قول كل شيء؟");

    const callArgs = messages.mock.calls[0][0];
    // The system prompt should mention preserving the verbatim French question.
    expect(JSON.stringify(callArgs)).toMatch(/verbatim/i);
  });

  it("throws if the model returns no tool_use block", async () => {
    const fakeClient = {
      messages: { create: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "..." }] }) },
    };
    await expect(
      // @ts-expect-error
      translateChunk(fakeClient, "claude-sonnet-4-6", {
        chunk_id: "x",
        theme: "valeurs",
        source: "livret",
        page: 4,
        fr_a: "ok",
      }),
    ).rejects.toThrow(/no tool_use/i);
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement `scripts/lib/translator.ts`.**

```ts
import type Anthropic from "@anthropic-ai/sdk";
import type { Chunk } from "../extract-source.ts";

export type Drafted = { fr_q: string; ar_q: string; ar_a: string };

const SYSTEM_VERBATIM = `You are translating French civic-education content for Arabic-speaking applicants for French citizenship.

Translate the provided French question and French answer into Modern Standard Arabic (الفصحى).

Rules:
- Do NOT abridge. Translate the full content.
- Do NOT interpret or simplify. Translate.
- Preserve French legal/historical terms in parentheses on first mention if helpful (e.g., "العلمانية (laïcité)").
- Use respectful, neutral register suitable for an official document.
- The French question is already authoritative — translate it; do NOT rewrite it in French.

Emit your output via the emit_card tool.`;

const SYSTEM_NEW = `You are turning French civic-education paragraphs into bilingual flashcards for Arabic-speaking applicants for French citizenship.

For the provided French paragraph (which is the verbatim ANSWER), produce:
1. A short French question (fr_q) that elicits this exact paragraph as its answer. The question should be specific, factual, and 5–25 words.
2. The Arabic translation of the question (ar_q).
3. The Arabic translation of the paragraph (ar_a).

Rules:
- The French answer text is fixed and verbatim from the Ministère de l'Intérieur — do NOT modify it; only generate fr_q.
- Use Modern Standard Arabic (الفصحى) for ar_q and ar_a.
- Do NOT abridge or interpret. Translate, don't paraphrase.
- Preserve French legal/historical terms in parentheses on first mention if useful.
- Use respectful, neutral register.

Emit your output via the emit_card tool.`;

const TOOL_EMIT_VERBATIM = {
  name: "emit_card",
  description: "Emit the Arabic translation of an existing verbatim French question and answer.",
  input_schema: {
    type: "object",
    properties: {
      ar_q: { type: "string", description: "The Arabic translation of the French question." },
      ar_a: { type: "string", description: "The Arabic translation of the French answer." },
    },
    required: ["ar_q", "ar_a"],
  },
} as const;

const TOOL_EMIT_NEW = {
  name: "emit_card",
  description: "Emit a French question and Arabic translations for a verbatim French answer.",
  input_schema: {
    type: "object",
    properties: {
      fr_q: {
        type: "string",
        description: "Short French question that elicits the verbatim answer.",
      },
      ar_q: { type: "string", description: "Arabic translation of fr_q." },
      ar_a: { type: "string", description: "Arabic translation of the French answer." },
    },
    required: ["fr_q", "ar_q", "ar_a"],
  },
} as const;

type AnyClient = Pick<Anthropic, "messages">;

export async function translateChunk(
  client: AnyClient,
  model: string,
  chunk: Chunk,
): Promise<Drafted> {
  const verbatim = chunk.verbatim_question === true && chunk.fr_q;
  const system = verbatim ? SYSTEM_VERBATIM : SYSTEM_NEW;
  const tool = verbatim ? TOOL_EMIT_VERBATIM : TOOL_EMIT_NEW;

  const userMsg = verbatim
    ? `French question (verbatim, do not change): ${chunk.fr_q}\n\nFrench answer (verbatim, do not change): ${chunk.fr_a}\n\nProduce ar_q and ar_a.`
    : `French answer (verbatim, do not change): ${chunk.fr_a}\n\nProduce fr_q (short, specific, 5-25 words), ar_q, ar_a.`;

  const resp = await client.messages.create({
    model,
    max_tokens: 1024,
    system,
    tools: [tool],
    tool_choice: { type: "tool", name: "emit_card" },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = resp.content.find((b: { type: string }) => b.type === "tool_use") as
    | { type: "tool_use"; input: Record<string, string> }
    | undefined;
  if (!toolUse) throw new Error("Model returned no tool_use block");

  const out = toolUse.input;
  if (verbatim) {
    return { fr_q: chunk.fr_q!, ar_q: out.ar_q, ar_a: out.ar_a };
  }
  if (!out.fr_q) throw new Error("Model did not produce fr_q for non-verbatim chunk");
  return { fr_q: out.fr_q, ar_q: out.ar_q, ar_a: out.ar_a };
}
```

- [ ] **Step 4: Run tests — pass.**

```bash
pnpm test scripts/lib/translator.test.ts
```

- [ ] **Step 5: Commit.**

```bash
git add scripts/lib/translator.ts scripts/lib/translator.test.ts
git commit -m "feat: translator wrapper using Anthropic tool-use for structured output"
```

---

### Task 7: `draft-cards.ts` end-to-end (with mocked client)

**Files:**

- Create: `scripts/draft-cards.ts`, `scripts/draft-cards.test.ts`

- [ ] **Step 1: Failing test at `scripts/draft-cards.test.ts`.**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { draftCards } from "./draft-cards";

const TMP = join(process.cwd(), "tmp-draft-test");

beforeEach(() => {
  mkdirSync(join(TMP, "raw"), { recursive: true });
  writeFileSync(
    join(TMP, "raw", "chunks.json"),
    JSON.stringify([
      {
        chunk_id: "valeurs-raw-001",
        source: "livret",
        page: 4,
        theme: "valeurs",
        fr_a: "La République garantit liberté, égalité, fraternité.",
      },
      {
        chunk_id: "valeurs-raw-002",
        source: "livret",
        page: 4,
        theme: "valeurs",
        fr_q: "Avez-vous le droit de tout dire ?",
        fr_a: "Oui, la liberté d'expression est un droit.",
        verbatim_question: true,
      },
      {
        chunk_id: "ddhc-raw-001",
        source: "livret",
        page: 24,
        theme: "ddhc",
        fr_a: "Art. 1er. Les hommes naissent libres et égaux.",
      },
    ]),
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

function fakeClient(): { messages: { create: ReturnType<typeof vi.fn> } } {
  let n = 0;
  return {
    messages: {
      create: vi.fn(async () => {
        n++;
        return {
          content: [
            {
              type: "tool_use",
              name: "emit_card",
              input: {
                fr_q: `Generated FR Q ${n}`,
                ar_q: `[ar] q ${n}`,
                ar_a: `[ar] a ${n}`,
              },
            },
          ],
        };
      }),
    },
  };
}

describe("draftCards", () => {
  it("writes one JSON file per theme into data/cards-draft/", async () => {
    await draftCards({ root: TMP, client: fakeClient() as never, model: "test" });
    expect(existsSync(join(TMP, "data/cards-draft/valeurs.json"))).toBe(true);
    expect(existsSync(join(TMP, "data/cards-draft/ddhc.json"))).toBe(true);
    const valeurs = JSON.parse(readFileSync(join(TMP, "data/cards-draft/valeurs.json"), "utf8"));
    expect(valeurs).toHaveLength(2);
    expect(valeurs[0].id).toMatch(/^valeurs-\d{3}$/);
    expect(valeurs[0]).toHaveProperty("ar_q");
    expect(valeurs[0]).toHaveProperty("ar_a");
    expect(valeurs[0].audio).toEqual({
      fr_q_sha1: "0000000000000000000000000000000000000000",
      fr_a_sha1: "0000000000000000000000000000000000000000",
    });
  });

  it("preserves verbatim French questions", async () => {
    await draftCards({ root: TMP, client: fakeClient() as never, model: "test" });
    const valeurs = JSON.parse(readFileSync(join(TMP, "data/cards-draft/valeurs.json"), "utf8"));
    const verbatim = valeurs.find((c: { fr_q: string }) => c.fr_q.startsWith("Avez-vous"));
    expect(verbatim).toBeDefined();
  });

  it("validates each emitted card against the Card Zod schema", async () => {
    await draftCards({ root: TMP, client: fakeClient() as never, model: "test" });
    // Re-validate using the same schema the app uses.
    const { CardArray } = await import("../src/lib/card.ts");
    for (const theme of ["valeurs", "ddhc"]) {
      const cards = JSON.parse(readFileSync(join(TMP, `data/cards-draft/${theme}.json`), "utf8"));
      expect(() => CardArray.parse(cards)).not.toThrow();
    }
  });

  it("supports --resume by skipping cards already present in draft files", async () => {
    // Pre-seed valeurs.json with one card.
    mkdirSync(join(TMP, "data/cards-draft"), { recursive: true });
    writeFileSync(
      join(TMP, "data/cards-draft/valeurs.json"),
      JSON.stringify([
        {
          id: "valeurs-001",
          theme: "valeurs",
          fr_q: "Already drafted ?",
          ar_q: "ar q",
          fr_a: "La République garantit liberté, égalité, fraternité.",
          ar_a: "ar a",
          source: "Livret p.4",
          audio: { fr_q_sha1: "0".repeat(40), fr_a_sha1: "0".repeat(40) },
        },
      ]),
    );
    const fc = fakeClient();
    await draftCards({ root: TMP, client: fc as never, model: "test", resume: true });
    // The valeurs chunk that matches by fr_a should NOT be re-translated.
    // Three chunks total, but one already drafted → at most 2 calls.
    expect(fc.messages.create.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement `scripts/draft-cards.ts`.**

```ts
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { CardArray, type Card, type ThemeId } from "../src/lib/card.ts";
import type { Chunk } from "./extract-source.ts";
import { translateChunk } from "./lib/translator.ts";
import { env } from "./lib/env.ts";

type AnyClient = Pick<Anthropic, "messages">;

const PLACEHOLDER_SHA1 = "0".repeat(40);

export type DraftOptions = {
  root?: string;
  client?: AnyClient;
  model?: string;
  resume?: boolean;
  themeFilter?: ThemeId;
};

export async function draftCards(opts: DraftOptions = {}) {
  const root = opts.root ?? process.cwd();
  const model = opts.model ?? env.anthropicModel();
  const client: AnyClient = opts.client ?? new Anthropic({ apiKey: env.anthropicKey() });

  const chunksPath = join(root, "raw/chunks.json");
  const chunks: Chunk[] = JSON.parse(readFileSync(chunksPath, "utf8"));

  const draftDir = join(root, "data/cards-draft");
  mkdirSync(draftDir, { recursive: true });

  // Load existing drafts (if any) so we can resume.
  const existing: Record<string, Card[]> = {};
  for (const c of chunks) {
    if (existing[c.theme]) continue;
    const path = join(draftDir, `${c.theme}.json`);
    if (existsSync(path)) {
      try {
        existing[c.theme] = JSON.parse(readFileSync(path, "utf8"));
      } catch {
        existing[c.theme] = [];
      }
    } else {
      existing[c.theme] = [];
    }
  }

  // Index by fr_a so we can skip already-drafted answers when --resume is set.
  const drafted = new Set<string>();
  if (opts.resume) {
    for (const arr of Object.values(existing)) {
      for (const card of arr) drafted.add(card.fr_a);
    }
  }

  const counters: Record<string, number> = {};
  for (const theme of Object.keys(existing)) {
    counters[theme] = existing[theme].length;
  }

  let processed = 0;
  let skipped = 0;
  const total = chunks.filter((c) => !opts.themeFilter || c.theme === opts.themeFilter).length;

  for (const chunk of chunks) {
    if (opts.themeFilter && chunk.theme !== opts.themeFilter) continue;
    if (drafted.has(chunk.fr_a)) {
      skipped++;
      continue;
    }
    counters[chunk.theme] = (counters[chunk.theme] ?? 0) + 1;
    const id = `${chunk.theme}-${String(counters[chunk.theme]).padStart(3, "0")}`;

    process.stdout.write(`  drafting ${id} (${++processed}/${total - skipped}) ... `);

    const out = await translateChunk(client, model, chunk);
    const card: Card = {
      id,
      theme: chunk.theme,
      fr_q: out.fr_q,
      ar_q: out.ar_q,
      fr_a: chunk.fr_a,
      ar_a: out.ar_a,
      source: chunk.source === "livret" ? `Livret p.${chunk.page}` : `Charte`,
      audio: { fr_q_sha1: PLACEHOLDER_SHA1, fr_a_sha1: PLACEHOLDER_SHA1 },
    };

    // Validate before persisting.
    CardArray.parse([card]);

    existing[chunk.theme].push(card);
    writeFileSync(
      join(draftDir, `${chunk.theme}.json`),
      JSON.stringify(existing[chunk.theme], null, 2),
    );
    process.stdout.write("✓\n");
  }

  return { processed, skipped, byTheme: counters };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const resume = args.includes("--resume");
  const themeIdx = args.indexOf("--theme");
  const themeFilter = themeIdx >= 0 ? (args[themeIdx + 1] as ThemeId | undefined) : undefined;

  draftCards({ resume, themeFilter })
    .then((r) => {
      console.log(`\nDrafted ${r.processed} new cards (skipped ${r.skipped} existing).`);
      console.log("By theme:");
      for (const [t, n] of Object.entries(r.byTheme).sort()) {
        console.log(`  ${t.padEnd(18)} ${n}`);
      }
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run tests — pass.**

```bash
pnpm test scripts/draft-cards.test.ts
```

- [ ] **Step 5: Commit.**

```bash
git add scripts/draft-cards.ts scripts/draft-cards.test.ts
git commit -m "feat: draft-cards.ts — Claude-driven Arabic translation + FR question generation"
```

---

### Task 8: `--theme` and `--resume` CLI flags wired

**Files:**

- Verify: `scripts/draft-cards.ts` (already implemented in Task 7)

- [ ] **Step 1: Add a small integration test at the bottom of `scripts/draft-cards.test.ts` (append to existing file).**

```ts
describe("draftCards CLI flags", () => {
  it("--theme filters chunks", async () => {
    const fc = fakeClient();
    await draftCards({ root: TMP, client: fc as never, model: "test", themeFilter: "ddhc" });
    expect(fc.messages.create.mock.calls.length).toBe(1); // Only the 1 ddhc chunk
    const ddhc = JSON.parse(readFileSync(join(TMP, "data/cards-draft/ddhc.json"), "utf8"));
    expect(ddhc).toHaveLength(1);
    expect(existsSync(join(TMP, "data/cards-draft/valeurs.json"))).toBe(false);
  });
});
```

(Reuse the `fakeClient` helper and `TMP` setup from earlier tests in the same file.)

- [ ] **Step 2: Run tests — passes.**

```bash
pnpm test scripts/draft-cards.test.ts
```

- [ ] **Step 3: Commit.**

```bash
git add scripts/draft-cards.test.ts
git commit -m "test: --theme filter for draft-cards"
```

---

# Phase 4 — Audio generation

### Task 9: ElevenLabs TTS wrapper (mocked)

**Files:**

- Create: `scripts/lib/tts.ts`, `scripts/lib/tts.test.ts`

- [ ] **Step 1: Failing test at `scripts/lib/tts.test.ts`.**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sha1, tts } from "./tts";

describe("sha1", () => {
  it("produces stable 40-char hex digest", () => {
    expect(sha1("hello")).toBe("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
    expect(sha1("hello").length).toBe(40);
  });
});

describe("tts", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("FAKE_MP3_BYTES").buffer,
    });
    // @ts-expect-error -- override global fetch for test
    globalThis.fetch = fetchMock;
  });
  afterEach(() => {
    // @ts-expect-error -- restore
    globalThis.fetch = undefined;
  });

  it("posts to the right URL with the right headers", async () => {
    const buf = await tts({
      apiKey: "key",
      voiceId: "v1",
      modelId: "eleven_multilingual_v2",
      text: "Bonjour le monde",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/v1");
    expect(init.method).toBe("POST");
    expect(init.headers["xi-api-key"]).toBe("key");
    expect(init.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body.text).toBe("Bonjour le monde");
    expect(body.model_id).toBe("eleven_multilingual_v2");
    expect(body.voice_settings).toEqual({ stability: 0.5, similarity_boost: 0.75 });
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it("throws on non-OK response with body included in the error message", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => '{"detail":"invalid_api_key"}',
    });
    await expect(tts({ apiKey: "bad", voiceId: "v1", modelId: "m", text: "x" })).rejects.toThrow(
      /401|invalid_api_key/,
    );
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement `scripts/lib/tts.ts`.**

```ts
import { createHash } from "node:crypto";

export function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

export type TtsOptions = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  text: string;
};

export async function tts(opts: TtsOptions): Promise<ArrayBuffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${opts.voiceId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": opts.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: opts.text,
      model_id: opts.modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status} ${res.statusText}: ${body}`);
  }
  return await res.arrayBuffer();
}
```

- [ ] **Step 4: Run tests — pass.**

- [ ] **Step 5: Commit.**

```bash
git add scripts/lib/tts.ts scripts/lib/tts.test.ts
git commit -m "feat: ElevenLabs TTS client with sha1 helper"
```

---

### Task 10: `build-audio.ts` end-to-end (mocked)

**Files:**

- Create: `scripts/build-audio.ts`, `scripts/build-audio.test.ts`

- [ ] **Step 1: Failing test at `scripts/build-audio.test.ts`.**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildAudio } from "./build-audio";
import { sha1 } from "./lib/tts";

const TMP = join(process.cwd(), "tmp-build-audio-test");

const ZERO = "0".repeat(40);

const sampleCard = (id: string, fr_q: string, fr_a: string) => ({
  id,
  theme: "valeurs",
  fr_q,
  ar_q: "س؟",
  fr_a,
  ar_a: "إ.",
  source: "Livret p.4",
  audio: { fr_q_sha1: ZERO, fr_a_sha1: ZERO },
});

beforeEach(() => {
  mkdirSync(join(TMP, "src/data/cards"), { recursive: true });
  mkdirSync(join(TMP, "public/audio"), { recursive: true });
  writeFileSync(
    join(TMP, "src/data/cards/valeurs.json"),
    JSON.stringify([
      sampleCard("valeurs-001", "Question 1 ?", "Réponse 1."),
      sampleCard("valeurs-002", "Question 2 ?", "Réponse 2."),
    ]),
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("buildAudio", () => {
  it("generates one MP3 per unique French text and rewrites card sha1s", async () => {
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
    });
    expect(fakeTts).toHaveBeenCalledTimes(4); // 2 cards × 2 clips
    expect(r.generated).toBe(4);
    expect(r.reused).toBe(0);

    const cards = JSON.parse(readFileSync(join(TMP, "src/data/cards/valeurs.json"), "utf8"));
    expect(cards[0].audio.fr_q_sha1).toBe(sha1("Question 1 ?"));
    expect(cards[0].audio.fr_a_sha1).toBe(sha1("Réponse 1."));
    expect(existsSync(join(TMP, `public/audio/${sha1("Question 1 ?")}.mp3`))).toBe(true);
  });

  it("skips clips whose MP3 already exists", async () => {
    // Pre-write the MP3 for the first question.
    writeFileSync(join(TMP, `public/audio/${sha1("Question 1 ?")}.mp3`), "existing");
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
    });
    expect(r.generated).toBe(3); // 1 already there
    expect(r.reused).toBe(1);
  });

  it("--dry-run does not call TTS or write files", async () => {
    const fakeTts = vi.fn();
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts as never,
      dryRun: true,
    });
    expect(fakeTts).not.toHaveBeenCalled();
    expect(r.generated).toBe(0);
    expect(r.dryRunChars).toBeGreaterThan(0);
    // No MP3s written.
    expect(readdirSync(join(TMP, "public/audio"))).toHaveLength(0);
  });

  it("--force regenerates even if MP3 exists", async () => {
    writeFileSync(join(TMP, `public/audio/${sha1("Question 1 ?")}.mp3`), "old");
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
      force: true,
    });
    expect(r.generated).toBe(4);
    expect(r.reused).toBe(0);
  });

  it("--theme limits to one theme JSON", async () => {
    mkdirSync(join(TMP, "src/data/cards"), { recursive: true });
    writeFileSync(
      join(TMP, "src/data/cards/histoire.json"),
      JSON.stringify([sampleCard("histoire-001", "QQ ?", "AA.")]),
    );
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
      theme: "valeurs",
    });
    expect(fakeTts).toHaveBeenCalledTimes(4); // valeurs only
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement `scripts/build-audio.ts`.**

```ts
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CardArray, type Card } from "../src/lib/card.ts";
import { sha1, tts as defaultTts, type TtsOptions } from "./lib/tts.ts";
import { env } from "./lib/env.ts";

export type BuildAudioOptions = {
  root?: string;
  apiKey?: string;
  voiceId?: string;
  modelId?: string;
  tts?: (text: string) => Promise<ArrayBuffer>;
  dryRun?: boolean;
  force?: boolean;
  theme?: string;
};

export type BuildAudioResult = {
  generated: number;
  reused: number;
  totalClips: number;
  dryRunChars: number;
};

export async function buildAudio(opts: BuildAudioOptions = {}): Promise<BuildAudioResult> {
  const root = opts.root ?? process.cwd();
  const cardsDir = join(root, "src/data/cards");
  const audioDir = join(root, "public/audio");
  mkdirSync(audioDir, { recursive: true });

  const apiKey = opts.apiKey ?? (opts.dryRun ? "" : env.elevenLabsKey());
  const voiceId = opts.voiceId ?? (opts.dryRun ? "" : env.elevenLabsVoiceId());
  const modelId = opts.modelId ?? (opts.dryRun ? "" : env.elevenLabsModelId());

  const tts =
    opts.tts ?? ((text: string) => defaultTts({ apiKey, voiceId, modelId, text } as TtsOptions));

  let generated = 0;
  let reused = 0;
  let dryRunChars = 0;
  let totalClips = 0;

  for (const file of readdirSync(cardsDir)) {
    if (!file.endsWith(".json")) continue;
    if (opts.theme && file !== `${opts.theme}.json`) continue;

    const path = join(cardsDir, file);
    const cards: Card[] = CardArray.parse(JSON.parse(readFileSync(path, "utf8")));
    let mutated = false;

    for (const card of cards) {
      for (const kind of ["fr_q", "fr_a"] as const) {
        const text = card[kind];
        const hash = sha1(text);
        const out = join(audioDir, `${hash}.mp3`);
        const fieldKey = `${kind}_sha1` as const;
        totalClips++;

        if (opts.dryRun) {
          dryRunChars += text.length;
          if (card.audio[fieldKey] !== hash) {
            // Would change the hash too; just count the text.
          }
          continue;
        }

        if (!opts.force && existsSync(out)) {
          reused++;
        } else {
          process.stdout.write(`  ${card.id} ${kind} (${text.length} chars) → ${hash}.mp3 ... `);
          const buf = await tts(text);
          writeFileSync(out, Buffer.from(buf));
          generated++;
          process.stdout.write("✓\n");
        }

        if (card.audio[fieldKey] !== hash) {
          card.audio[fieldKey] = hash;
          mutated = true;
        }
      }
    }

    if (mutated && !opts.dryRun) {
      writeFileSync(path, JSON.stringify(cards, null, 2));
    }
  }

  return { generated, reused, totalClips, dryRunChars };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const themeIdx = args.indexOf("--theme");
  const theme = themeIdx >= 0 ? args[themeIdx + 1] : undefined;

  buildAudio({ dryRun, force, theme })
    .then((r) => {
      if (dryRun) {
        console.log(`Dry-run: ${r.totalClips} clips, ${r.dryRunChars} characters total.`);
        console.log(`Estimate cost from your ElevenLabs plan's per-character rate.`);
      } else {
        console.log(`Generated ${r.generated}, reused ${r.reused}. Total clips: ${r.totalClips}.`);
      }
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run tests — pass.**

```bash
pnpm test scripts/build-audio.test.ts
```

- [ ] **Step 5: Commit.**

```bash
git add scripts/build-audio.ts scripts/build-audio.test.ts
git commit -m "feat: build-audio.ts — content-addressed MP3 generation with --dry-run/--force/--theme"
```

---

### Task 11: Verify the full mocked pipeline runs end-to-end

**Files:**

- Create: `scripts/pipeline.test.ts`

- [ ] **Step 1: Integration test.**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { extractSource } from "./extract-source";
import { draftCards } from "./draft-cards";
import { buildAudio } from "./build-audio";
import { CardArray } from "../src/lib/card";

const TMP = join(process.cwd(), "tmp-pipeline-test");

beforeEach(() => {
  mkdirSync(join(TMP, "raw"), { recursive: true });
  // Copy the real raw files in if they exist; otherwise use a tiny sample.
  const realLivret = join(process.cwd(), "raw/livret.txt");
  const realCharte = join(process.cwd(), "raw/charte.txt");
  if (existsSync(realLivret)) copyFileSync(realLivret, join(TMP, "raw/livret.txt"));
  else
    writeFileSync(
      join(TMP, "raw/livret.txt"),
      "===== PAGE 4 =====\nLa République garantit liberté, égalité, fraternité.",
    );
  if (existsSync(realCharte)) copyFileSync(realCharte, join(TMP, "raw/charte.txt"));
  else
    writeFileSync(
      join(TMP, "raw/charte.txt"),
      "===== PAGE 1 =====\nTout être humain possède des droits.",
    );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("pipeline (extract → draft → build-audio)", () => {
  it("runs end-to-end with mocked APIs and produces valid Cards + MP3s", async () => {
    // 1. Extract
    const ext = await extractSource({ root: TMP });
    expect(ext.count).toBeGreaterThan(0);

    // 2. Draft (mocked Claude)
    let n = 0;
    const fakeClient = {
      messages: {
        create: vi.fn(async () => {
          n++;
          return {
            content: [
              {
                type: "tool_use",
                name: "emit_card",
                input: {
                  fr_q: `Generated Q ${n} ?`,
                  ar_q: `[ar] q ${n}`,
                  ar_a: `[ar] a ${n}`,
                },
              },
            ],
          };
        }),
      },
    };
    await draftCards({ root: TMP, client: fakeClient as never, model: "test" });

    // 3. Promote drafts to src/data/cards (the user does this manually in real runs)
    mkdirSync(join(TMP, "src/data/cards"), { recursive: true });
    const drafts = ["valeurs", "droits-devoirs", "ddhc"]; // sample
    for (const t of drafts) {
      const draftPath = join(TMP, `data/cards-draft/${t}.json`);
      if (existsSync(draftPath)) {
        copyFileSync(draftPath, join(TMP, `src/data/cards/${t}.json`));
      }
    }

    // 4. Build audio (mocked TTS)
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    const audio = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
    });
    expect(audio.generated).toBeGreaterThan(0);

    // 5. Validate that every card now has real sha1s and MP3s
    for (const t of drafts) {
      const path = join(TMP, `src/data/cards/${t}.json`);
      if (!existsSync(path)) continue;
      const cards = CardArray.parse(JSON.parse(readFileSync(path, "utf8")));
      for (const card of cards) {
        expect(card.audio.fr_q_sha1).not.toBe("0".repeat(40));
        expect(card.audio.fr_a_sha1).not.toBe("0".repeat(40));
        expect(existsSync(join(TMP, `public/audio/${card.audio.fr_q_sha1}.mp3`))).toBe(true);
      }
    }
  }, 30_000);
});
```

- [ ] **Step 2: Run — pass.**

```bash
pnpm test scripts/pipeline.test.ts
```

- [ ] **Step 3: Commit.**

```bash
git add scripts/pipeline.test.ts
git commit -m "test: end-to-end pipeline integration test (mocked APIs)"
```

---

# Phase 5 — User runbook + integration

### Task 12: Write the user-facing runbook

**Files:**

- Create: `docs/RUNBOOK-PLAN-2.md`

- [ ] **Step 1: Write `docs/RUNBOOK-PLAN-2.md`.**

````markdown
# Plan 2 Runbook — populating the real corpus

Plan 2 builds the offline tooling that turns the Ministère de l'Intérieur PDFs into the full bilingual flashcard corpus + French audio. The implementation tasks (1–11) ship the scripts. **This runbook is what YOU run** to actually produce content using your own API keys.

## Prerequisites

1. **Anthropic API key** — sign up at https://console.anthropic.com/ and create a key.
2. **ElevenLabs API key + Voice ID** — sign up at https://elevenlabs.io/, create a key, and pick a voice from https://elevenlabs.io/app/voice-library. Note the voice ID (a string like `XB0fDUnXU5powFXDhCwa`).
3. **Disk** — ~10 MB free for generated MP3s.
4. **Budget** — drafting ≈ $1–2 with Claude Sonnet at 100 cards. Audio ≈ $5–15 with ElevenLabs Starter at ~50,000 characters.

## Step 1 — Configure environment

```bash
cp .env.example .env.local
# Edit .env.local:
#   ANTHROPIC_API_KEY=sk-ant-...
#   ELEVENLABS_API_KEY=...
#   ELEVENLABS_VOICE_ID=<your chosen voice>
```
````

## Step 2 — Extract chunks from the PDFs

```bash
pnpm extract:source
```

Expected: `Extracted ~80–130 chunks → raw/chunks.json`, with a per-theme breakdown.

You can inspect `raw/chunks.json` directly. Look in particular for `verbatim_question: true` entries — those are the 8 Ministry-authored Q&A boxes that we keep as-is.

## Step 3 — Draft Arabic translations + French questions

```bash
pnpm draft:cards
```

This calls Claude once per chunk (with retries handled by the SDK). It writes draft cards to `data/cards-draft/<theme>.json`.

Tips:

- If the run is interrupted, restart with `pnpm draft:cards --resume` to skip already-drafted chunks.
- To regenerate one theme only: `pnpm draft:cards --theme valeurs`.

When done, you'll have 6 draft files: `data/cards-draft/valeurs.json`, etc.

## Step 4 — Review the Arabic translations

This is the most important manual step. Open each `data/cards-draft/<theme>.json` in your editor and review every `ar_q` and `ar_a` field. You're checking:

- Translation accuracy (esp. legal/civic vocabulary like _laïcité_, _suffrage indirect_, _déchu de la nationalité_).
- Modern Standard Arabic (الفصحى), not regional dialect.
- Tone matches a formal civic document.

For verbatim Q&A boxes (Ministry text), the **French** is fixed — only the Arabic should be edited.
For other cards, you can also tweak `fr_q` if the AI-generated question reads awkwardly.

When you are satisfied with a theme's draft file, **promote it** to the live data directory:

```bash
# Replace the Plan 1 fixture cards
mv src/data/cards/valeurs.json src/data/cards/valeurs.json.fixture-backup
mv data/cards-draft/valeurs.json src/data/cards/valeurs.json
```

(Repeat for each of the 6 themes. Keep the fixture-backup files until after Step 6 succeeds; then delete.)

## Step 5 — Generate French audio

Estimate cost first (no characters spent):

```bash
pnpm build:audio --dry-run
```

This prints something like:

```
Dry-run: 200 clips, 52,438 characters total.
```

Multiply that character count by your ElevenLabs plan's per-character rate to estimate cost. Adjust your subscription tier if needed.

Then run for real:

```bash
pnpm build:audio
```

The script:

- Reads each card in `src/data/cards/*.json`
- For each French question and answer, computes `sha1(text)`
- If `public/audio/<sha1>.mp3` already exists → skips
- Otherwise → calls ElevenLabs and saves the MP3
- Updates the card JSON with the real sha1 (overwriting the `0000…0001` placeholders)

After completion, you should see `public/audio/` populated with ~200 MP3s totaling ~5–8 MB.

If you change a French question or answer later, just re-run `pnpm build:audio` — only changed clips are regenerated.

## Step 6 — Validate everything

```bash
pnpm validate:cards
```

(No `SKIP_AUDIO_CHECK=1` this time — the audio files now exist.)

Expected output:

```
✓ valeurs.json: 12 cards
✓ droits-devoirs.json: 22 cards
…
N cards total
✓ all audio files present
```

If any audio file is missing, the script lists which `<sha1>.mp3` is absent. Re-run `pnpm build:audio --force` for the affected card or theme.

## Step 7 — Verify the app

```bash
pnpm dev
```

Open http://localhost:5173 and click through each deck. Tap a card to flip; tap the play button to hear French audio.

## Step 8 — Commit + deploy

```bash
git add src/data/cards/ public/audio/ raw/chunks.json
git commit -m "feat: populate full corpus with real content and French audio"
git push
```

If you have CI + Cloudflare Pages connected (per `docs/DEPLOY.md`), the push will deploy. Otherwise, follow `docs/DEPLOY.md` to connect.

## Step 9 — Drop the SKIP_AUDIO_CHECK escape hatch in CI

Edit `.github/workflows/ci.yml`. Find the line:

```yaml
- run: SKIP_AUDIO_CHECK=1 pnpm validate:cards
```

and change it to:

```yaml
- run: pnpm validate:cards
```

Commit:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: enforce audio file presence in validate:cards now that audio is committed"
git push
```

CI now fails any future PR that adds a card without generating its audio.

## Troubleshooting

- **`pnpm draft:cards` errors with 401** — your `ANTHROPIC_API_KEY` is missing or invalid. Check `.env.local`.
- **`pnpm build:audio` errors with 401** — same, for `ELEVENLABS_API_KEY`. Check that the voice ID is also set.
- **Generation produces "voice not found" errors** — verify the voice ID exists for your account at https://elevenlabs.io/app/voice-library.
- **Some Arabic translations look off** — edit them by hand in the JSON files. The Arabic is your authoritative source; AI is only a starting draft.
- **Card text ends up wrong after editing** — `pnpm build:audio` regenerates audio whenever the French text changes (because the sha1 changes).

````

- [ ] **Step 2: Verify the markdown renders cleanly.**

```bash
pnpm format
pnpm format:check
````

(Prettier may reformat slightly. Confirm it remains readable.)

- [ ] **Step 3: Commit.**

```bash
git add docs/RUNBOOK-PLAN-2.md
git commit -m "docs: Plan 2 runbook for users to populate the corpus + audio"
```

---

### Task 13: Update README to point to Plan 2 tooling

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Read `README.md` and find the "Local development" section.**

- [ ] **Step 2: Replace the existing scripts block in "Local development" with this expanded one (preserve everything else):**

````markdown
## Local development

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit + component tests (both src/ and scripts/)
pnpm test:e2e     # Playwright (run pnpm build first)
pnpm lint
pnpm typecheck
pnpm validate:cards   # validates JSON schema + audio file presence
pnpm build
pnpm preview      # http://localhost:4173
```

## Content pipeline (Plan 2)

The repo ships a tooling pipeline for producing the bilingual corpus and French audio. See [docs/RUNBOOK-PLAN-2.md](docs/RUNBOOK-PLAN-2.md) for the full step-by-step guide. Quick reference:

```bash
cp .env.example .env.local      # add your Anthropic + ElevenLabs keys
pnpm extract:source             # PDFs → raw/chunks.json
pnpm draft:cards                # → data/cards-draft/<theme>.json (Claude API)
# ...review Arabic translations, then promote drafts to src/data/cards/...
pnpm build:audio --dry-run      # cost estimate
pnpm build:audio                # ElevenLabs API → public/audio/<sha1>.mp3
pnpm validate:cards             # final check before commit
```
````

- [ ] **Step 3: Update the "Project layout" block to reflect the new files.**

Find the existing layout block and replace with:

````markdown
## Project layout

```
src/
  data/cards/*.json        ← card content (now full corpus, not fixtures)
  data/themes.ts           ← 6 themes registry
  lib/                     ← schema, audio, progress, theme, shuffle
  components/flashcard/    ← Flashcard, CardFront/Back, AudioButton, FlagAccent, ResponseButtons
  components/deck/         ← DeckPicker, DeckTile, StudySession, sessionReducer
  components/layout/       ← Header, Footer, DarkModeToggle
  routes/                  ← Home, Study, About
public/audio/              ← MP3s, content-addressed by sha1(text)
scripts/                   ← extract-source, draft-cards, build-audio, validate-cards
  lib/                     ← chunk, translator, tts, env (shared script utilities)
raw/                       ← extracted PDF text + chunks.json
data/cards-draft/          ← AI-drafted cards awaiting human review (gitignored or temporary)
```
````

- [ ] **Step 4: Add `data/cards-draft/` to `.gitignore` (so accidental commits of un-reviewed drafts don't pollute history).**

Append to `.gitignore`:

```
data/cards-draft/
```

- [ ] **Step 5: Verify all gates green.**

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

- [ ] **Step 6: Commit.**

```bash
git add README.md .gitignore
git commit -m "docs: README — point to Plan 2 content pipeline + .gitignore drafts dir"
```

---

### Task 14: Wire the script test files into the existing `pnpm test`

**Files:**

- Verify: `vite.config.ts` (Task 3 already updated `test.include`)
- Modify: `tsconfig.app.json` (may need to expose `scripts/` to typecheck)

- [ ] **Step 1: Run `pnpm typecheck` and check whether script files have unresolved imports.**

If `pnpm typecheck` complains about anything in `scripts/`, the test config is fine but the typechecker isn't seeing the scripts. The TypeScript fix is to **add a separate scripts tsconfig**.

If typecheck passes cleanly with all scripts/, skip to Step 4.

- [ ] **Step 2: If typecheck is failing for scripts/, create `tsconfig.scripts.json`:**

```json
{
  "extends": "./tsconfig.app.json",
  "include": ["scripts/**/*.ts"],
  "compilerOptions": {
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  }
}
```

And update the `typecheck` script in `package.json` to:

```json
"typecheck": "tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.scripts.json"
```

- [ ] **Step 3: Run `pnpm typecheck` — clean.**

- [ ] **Step 4: Run the full test suite to ensure script tests are picked up.**

```bash
pnpm test
```

Expected: original 45 tests PLUS new tests from chunk, translator, draft-cards, tts, build-audio, pipeline. Roughly 60+ tests now.

- [ ] **Step 5: Run all gates.**

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

All clean.

- [ ] **Step 6: Commit.**

```bash
git add tsconfig.scripts.json package.json
git commit -m "chore: typecheck scripts/ via dedicated tsconfig"
```

(If Step 2 wasn't needed, replace this commit with: `chore: confirm scripts/ is included in test+typecheck` and just commit any remaining incidental changes, or skip the commit entirely.)

---

# Self-review

Run after final commit:

- [ ] Spec coverage:
  - §7 authoring pipeline → Tasks 3–8 (extract-source + draft-cards + translator) ✓
  - §8 audio pipeline → Tasks 9–11 (tts + build-audio) ✓
  - §7.4 card volume estimates → produced naturally; verified by extract-source per-theme report ✓
  - "Cost guard" §8.5 → `--dry-run` flag in Task 10 ✓
  - "Voice selection" §8.3 → `.env.local` config in Task 1 ✓
  - "Error handling" §8.4 → tts.ts throws on non-OK with body in error message (Task 9) ✓
  - User runbook → Task 12 ✓
  - CI flip from `SKIP_AUDIO_CHECK=1` → Task 12 Step 9 (documented for user, not done in plan since plan engineers don't have audio yet) ✓
- [ ] No placeholders, TODOs, or "implement later" text in any task.
- [ ] Type/method names consistent across tasks: `Card`, `CardArray`, `Chunk`, `Drafted`, `themeForPage`, `splitPages`, `splitParagraphs`, `detectQABox`, `translateChunk`, `sha1`, `tts`, `buildAudio`, `draftCards`, `extractSource`. All match.
- [ ] Each task ends in a commit.
- [ ] Plan 2's output is a deployable upgrade: after the user runs the runbook, `pnpm validate:cards` passes without `SKIP_AUDIO_CHECK`, `pnpm build` produces the same SPA but now with real audio, and the deploy is unchanged.

---

# Plan 3 candidates (out of scope for Plan 2)

After Plan 2 ships, natural follow-ups:

- **Visual regression tests** (deferred from Plan 1 §15): now that fixture cards are stable, capture Playwright screenshots and gate diffs at >0.1%.
- **PWA / offline install** (Plan 1 D17): add `vite-plugin-pwa` so users can install the app on mobile and study offline. ~½ day.
- **Translation review tooling**: a `pnpm review:cards` helper that opens each draft side-by-side with the source and waits for accept/edit/reject keystrokes.
- **Additional source languages**: extend the `Card` schema with `en_q`, `en_a`, etc., and add an English drafting pass to broaden the audience.
- **Quiz mode**: multiple-choice generated from the same card pool (Plan 1 §18 explicitly out of v1, candidate for v1.1).
