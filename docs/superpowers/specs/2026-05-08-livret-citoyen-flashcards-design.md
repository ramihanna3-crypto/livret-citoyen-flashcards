# Livret du Citoyen — Bilingual Flashcards Web App

**Author:** Rami Hanna
**Date:** 2026-05-08
**Status:** Design approved (brainstorming complete, awaiting final user review before plan)
**Audience:** French citizenship applicants whose first language is Arabic

---

## 1. Overview

A free, ad-free, account-free web app that drills the verbatim contents of the official French study materials for naturalization, with Arabic translations as a comprehension aid. Users flip cards (French question on the front, French answer on the back), see an Arabic translation beneath each side, and listen to the French audio so they can hear and read together.

**Problem solved:** Arabic-speaking candidates often have access to the *Livret du citoyen* PDF but no good way to memorize it actively, no audio support to train listening, and no translation aid for civic terms (*laïcité*, *suffrage indirect*, *déchu de la nationalité*, …). This app turns the PDFs into a practice tool that runs on any phone for free.

**Non-goals:** This is not a course, not a translation reference, not a mock interview. It is a memorization tool for the verbatim source text.

---

## 2. Source materials

| Document | Pages | Status | Use |
|---|---|---|---|
| `Livret-du-citoyen-accessible.pdf` (Ministère de l'Intérieur, février 2022) | 28 | Text extracted via `pypdf` to `raw/livret.txt` | Primary corpus. Verbatim French answers + 8 official Q&A pairs. |
| `Charte-des-droits-et-devoirs-du-citoyen-francais.pdf` | 2 | Image-only PDF; OCRed via macOS Vision framework to `raw/charte.txt` | Secondary corpus. Verbatim French answers, principally feeding the **Droits & devoirs** theme. |

The DDHC of 1789 (17 articles) is contained inside the Livret on pages 24–25 and forms its own theme.

---

## 3. Decision log

These are locked decisions from the brainstorm. Implementation must not deviate without re-opening the question with the user.

| # | Decision | Locked value |
|---|---|---|
| D1 | Source set | Livret + Charte (both via OCR / text extract) + DDHC extracted from Livret pp. 24–25 |
| D2 | Authoring approach | **Hybrid** — keep 8 official Livret Q&A boxes verbatim; AI-draft remaining Q's and **all** Arabic translations from the verbatim French answer; user reviews the Arabic before merging |
| D3 | Audio | Pre-generated **at build time** via ElevenLabs; **French only**, no Arabic audio |
| D4 | Progress model | Light SRS: per-card `Je sais ✓` / `À revoir ✗`, persisted in `localStorage`, no accounts |
| D5 | Deck organization | Six themed decks + one "Tout mélanger" mode |
| D6 | Tech stack | Vite + React 18 + TypeScript + Tailwind v4 + shadcn/ui |
| D7 | Mobile-first | Yes; responsive up to desktop (≤ 1280 px design width) |
| D8 | Hosting | Cloudflare Pages, free tier, free `*.pages.dev` subdomain for v1 |
| D9 | Theme tokens | User-supplied indigo/slate Tailwind v4 token sheet, dark mode included |
| D10 | French flag treatment | Vertical tricolor strip on left edge of every card; tiny tricolor underline beneath the app title; tricolor accent on favicon. No bigger flag presence. |
| D11 | Auto-advance | After **`Je sais ✓` only**. After `À revoir ✗`, stay on the card. |
| D12 | Tap-to-flip | Entire card surface flips on tap (Space on keyboard) |
| D13 | License — code | MIT |
| D14 | License — translations | CC BY-SA 4.0 (Arabic translations are original work) |
| D15 | License — French content | Cited as © Ministère de l'Intérieur public administrative document |
| D16 | Footer attribution | "Contenu original © Ministère de l'Intérieur. Traduction arabe et application : Rami Hanna, CC BY-SA 4.0. Application non officielle." |
| D17 | PWA / offline | **Out of v1.** Re-evaluate as v1.1. |
| D18 | Out-of-scope (no debate) | Accounts, server, database, full SM-2 SRS, quiz mode, social, notifications, print/export, custom cards, additional languages |

---

## 4. Tech stack

```
Vite 5            ← build & dev
React 18          ← UI
TypeScript 5      ← types
Tailwind CSS v4   ← styling (using user-supplied token sheet)
shadcn/ui         ← Button, Progress, Dialog, Switch, Tooltip primitives
react-router-dom 6 ← hash-based routing
zod 3             ← runtime card schema validation
@fontsource       ← Inter, Merriweather, Noto Sans Arabic, JetBrains Mono
lucide-react      ← icons
vitest + @testing-library/react + jsdom  ← unit + component tests
@playwright/test  ← e2e
eslint + prettier ← lint/format
pnpm              ← package manager
```

No SSR, no server, no Node runtime in production. Final artifact is a static `dist/` folder.

---

## 5. Project structure

```
livret-citoyen/
├── public/
│   ├── audio/                       # generated MP3s, content-addressed by sha1(text)
│   ├── fonts/                       # @fontsource subset packages (vendored)
│   ├── og.png                       # social preview
│   └── favicon.svg                  # tricolor LC monogram
├── raw/
│   ├── livret.txt                   # already extracted
│   ├── charte.txt                   # already OCRed
│   └── chunks.json                  # produced by extract-source.ts
├── data/
│   └── cards-draft/                 # AI-drafted cards awaiting human review (not shipped)
├── scripts/
│   ├── build-audio.ts               # ElevenLabs generation, idempotent, content-addressed
│   ├── extract-source.ts            # one-time: PDF text → raw/chunks.json
│   ├── draft-cards.ts               # one-time: AI-drafts ar_q, ar_a, fr_q from chunks
│   └── validate-cards.ts            # CI guard: Zod parses every JSON; every audio sha1 has a file
├── src/
│   ├── main.tsx
│   ├── App.tsx                      # router root
│   ├── index.css                    # Tailwind v4 + theme tokens
│   ├── lib/
│   │   ├── card.ts                  # Zod schema + types
│   │   ├── audio.ts                 # sha1 helper, audio URL builder, play/pause hook
│   │   ├── progress.ts              # localStorage adapter (versioned)
│   │   ├── shuffle.ts
│   │   └── theme.ts                 # dark mode hook
│   ├── data/
│   │   ├── cards/
│   │   │   ├── valeurs.json
│   │   │   ├── droits-devoirs.json
│   │   │   ├── institutions.json
│   │   │   ├── histoire.json
│   │   │   ├── geographie.json
│   │   │   └── ddhc.json
│   │   ├── themes.ts                # Theme registry (id, label-fr, label-ar, color, icon)
│   │   └── index.ts                 # loads + Zod-validates all cards on import
│   ├── components/
│   │   ├── flashcard/
│   │   │   ├── Flashcard.tsx
│   │   │   ├── CardFront.tsx
│   │   │   ├── CardBack.tsx
│   │   │   ├── AudioButton.tsx
│   │   │   ├── ResponseButtons.tsx
│   │   │   └── FlagAccent.tsx
│   │   ├── deck/
│   │   │   ├── DeckPicker.tsx
│   │   │   ├── DeckTile.tsx
│   │   │   ├── DeckProgressRing.tsx
│   │   │   └── StudySession.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DarkModeToggle.tsx
│   │   └── ui/                      # shadcn primitives
│   └── routes/
│       ├── Home.tsx
│       ├── Study.tsx
│       └── About.tsx
├── tests/
│   ├── unit/                        # vitest
│   └── e2e/                         # playwright
├── .github/workflows/ci.yml
├── .env.example                     # ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. Data model

### 6.1 Card schema (`src/lib/card.ts`)

```ts
import { z } from "zod";

export const ThemeId = z.enum([
  "valeurs",
  "droits-devoirs",
  "institutions",
  "histoire",
  "geographie",
  "ddhc",
]);
export type ThemeId = z.infer<typeof ThemeId>;

export const Card = z.object({
  id:     z.string().regex(/^[a-z-]+-\d{3}$/),    // e.g. "valeurs-001"
  theme:  ThemeId,
  fr_q:   z.string().min(3).max(400),
  ar_q:   z.string().min(3).max(400),
  fr_a:   z.string().min(3).max(2000),            // verbatim from source
  ar_a:   z.string().min(3).max(2000),
  source: z.string().min(3),                      // e.g. "Livret p.4" or "Charte §Liberté"
  audio: z.object({
    fr_q_sha1: z.string().regex(/^[a-f0-9]{40}$/),
    fr_a_sha1: z.string().regex(/^[a-f0-9]{40}$/),
  }),
});
export type Card = z.infer<typeof Card>;

export const CardArray = z.array(Card);
```

**Validation timing:**

- `src/data/index.ts` parses every theme JSON at app boot. Failure throws → Vite dev shows the error overlay; in production, the app shows a friendly fallback page asking the user to refresh and reports the error to the console (no telemetry).
- `scripts/validate-cards.ts` runs the same Zod parse in CI before the build step. CI fails on any malformed card.
- `validate-cards.ts` additionally checks that for every card, both `public/audio/<fr_q_sha1>.mp3` and `public/audio/<fr_a_sha1>.mp3` exist on disk. CI fails if any audio file is missing.

### 6.2 Theme registry (`src/data/themes.ts`)

```ts
import type { ThemeId } from "@/lib/card";
import { Scale, ShieldCheck, Building2, Landmark, Map, ScrollText } from "lucide-react";

export type Theme = {
  id: ThemeId;
  label_fr: string;
  label_ar: string;
  description_fr: string;
  description_ar: string;
  icon: typeof Scale;
  accentClass: string;   // Tailwind class for the tile bg tint
};

export const themes: Theme[] = [
  { id: "valeurs",         label_fr: "Valeurs & principes",
    label_ar: "القيم والمبادئ",            icon: Scale,        accentClass: "bg-indigo-50 dark:bg-indigo-950/30",
    description_fr: "Liberté, égalité, fraternité, laïcité.",
    description_ar: "الحرية، المساواة، الإخاء، العلمانية." },
  { id: "droits-devoirs",  label_fr: "Droits & devoirs",
    label_ar: "الحقوق والواجبات",          icon: ShieldCheck,  accentClass: "bg-violet-50 dark:bg-violet-950/30",
    description_fr: "Ce que le citoyen doit faire et ne doit pas faire.",
    description_ar: "ما يجب على المواطن فعله وما لا يجب فعله." },
  { id: "institutions",    label_fr: "Institutions politiques",
    label_ar: "المؤسسات السياسية",        icon: Building2,    accentClass: "bg-purple-50 dark:bg-purple-950/30",
    description_fr: "Président, Parlement, justice, collectivités.",
    description_ar: "الرئيس، البرلمان، العدالة، الجماعات المحلية." },
  { id: "histoire",        label_fr: "Histoire de France",
    label_ar: "تاريخ فرنسا",              icon: Landmark,     accentClass: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    description_fr: "Préhistoire au XXᵉ siècle.",
    description_ar: "من عصور ما قبل التاريخ إلى القرن العشرين." },
  { id: "geographie",      label_fr: "Géographie & place de la France",
    label_ar: "الجغرافيا ومكانة فرنسا",  icon: Map,          accentClass: "bg-pink-50 dark:bg-pink-950/30",
    description_fr: "Régions, fleuves, Europe, économie.",
    description_ar: "المناطق، الأنهار، أوروبا، الاقتصاد." },
  { id: "ddhc",            label_fr: "Droits de l'Homme 1789",
    label_ar: "إعلان حقوق الإنسان 1789",  icon: ScrollText,   accentClass: "bg-rose-50 dark:bg-rose-950/30",
    description_fr: "Les 17 articles fondateurs.",
    description_ar: "المواد السبعة عشر التأسيسية." },
];
```

### 6.3 LocalStorage schema

```ts
// key: "lc.progress.v1"
type ProgressV1 = {
  v: 1;
  cards: Record<string /* cardId */, {
    status: "known" | "review";
    lastSeenAt: number;          // epoch ms
  }>;
  prefs: {
    darkMode: "system" | "light" | "dark";
    autoAdvance: boolean;        // default true
  };
};
```

Migration policy: unknown `v` → reset to defaults, surface a one-time toast: *"Données de progrès réinitialisées après mise à jour de l'application."* / *"تمت إعادة ضبط بيانات التقدم بعد تحديث التطبيق."*

---

## 7. Authoring pipeline (one-time, before launch)

Three scripts. All live in `scripts/`. They are run **only during initial card creation** and remain in the repo as one-time tooling.

### 7.1 `extract-source.ts`

- **Input:** `raw/livret.txt`, `raw/charte.txt`.
- **Output:** `raw/chunks.json` — a flat array of `{ chunk_id, theme, source, fr_a }` where `fr_a` is a verbatim paragraph from the source.
- **Logic:**
  - Heuristic split by paragraph boundaries.
  - Filter out tables of contents, page numbers, image captions, dotted-line empty form fields.
  - Detect the 8 colored Q&A boxes in the Livret (they follow the recognizable pattern `Question? — Réponse`) and emit them as `{ chunk_id, theme, source, fr_q, fr_a }`. These are flagged `verbatim_question: true` so the next script never overwrites them.
  - Tag theme by page range: pp. 4–7 → `valeurs`, pp. 7–8 → `droits-devoirs` (Livret part), pp. 9–11 → `institutions`, pp. 12–19 → `histoire`, pp. 20–23 → `geographie`, pp. 24–25 → `ddhc`. The full Charte → `droits-devoirs`. DDHC articles split one card per article.

### 7.2 `draft-cards.ts`

- **Input:** `raw/chunks.json`, an Anthropic API key (from `.env.local`).
- **Output:** `data/cards-draft/<theme>.json` — populated cards with placeholder `audio` field.
- **Logic per chunk:**
  - If `verbatim_question: true` → keep `fr_q` as-is, only generate `ar_q` and `ar_a` via Claude.
  - Else → generate `fr_q` (a short prompt that elicits the chunk as its answer), `ar_q`, `ar_a`.
  - System prompt instructs the model: *"You are translating French civic education content for Arabic-speaking citizenship applicants. Preserve French legal/historical terms in parentheses on first mention. Use Modern Standard Arabic (فصحى). Do not abridge. Do not interpret — translate."*
  - Each draft card is run through Zod before being written. Malformed → log + skip.

### 7.3 Manual review

User opens `data/cards-draft/<theme>.json` in editor, reviews each card's Arabic, edits as needed, then moves the file to `src/data/cards/<theme>.json` once satisfied.

The 8 Ministry Q&A boxes are flagged in a comment header so the user knows not to rewrite their French text.

### 7.4 Card volume estimate

Based on the source page counts and natural paragraph density:

| Theme | Target cards |
|---|---|
| valeurs | 12–18 |
| droits-devoirs | 18–25 (Livret + Charte combined) |
| institutions | 12–16 |
| histoire | 18–24 |
| geographie | 8–12 |
| ddhc | 17 (one per article, fixed) |
| **Total** | **85–112** |

---

## 8. Audio pipeline (`scripts/build-audio.ts`)

### 8.1 Behavior

```
For each card in src/data/cards/*.json:
  For kind in ["fr_q", "fr_a"]:
    text = card[kind]
    sha = sha1(text)
    out = `public/audio/${sha}.mp3`
    if exists(out): reuse, mark as kept
    else:
      mp3 = elevenLabs.tts(text, voiceId, {
        model_id: "eleven_multilingual_v2",
        stability: 0.5,
        similarity_boost: 0.75,
        output_format: "mp3_44100_128"
      })
      write(out, mp3)
      mark as generated
    card.audio[`${kind}_sha1`] = sha
After loop: re-prettify and save each theme JSON with updated audio fields.
Print summary: "Generated N, reused M, total clips: K, total chars: C"
```

### 8.2 Flags

- `--dry-run` — print what would be generated and the total character count (≈ ElevenLabs cost) without spending credits.
- `--theme <id>` — restrict to one theme during iterative review.
- `--force` — re-generate even if MP3 exists (used after a voice change).

### 8.3 Voice selection

- The user picks the voice ID themselves from the ElevenLabs voice library.
- `.env.local` holds `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. `.env.example` ships with placeholders.
- If the user later changes voice, `pnpm build:audio --force` re-renders the whole corpus.

### 8.4 Error handling

- 4xx response → log card id + the offending text, exit non-zero. No silent partial commits.
- 5xx or rate limit → exponential backoff up to 3 retries, then fail.
- Network outage → fail fast with a clear message; previously generated MP3s on disk remain valid.

### 8.5 Cost ceiling

- Approximate corpus: ~100 cards × 2 clips. Average French question ≈ 80 chars, average French answer ≈ 400 chars. Total ≈ **45,000–55,000 characters** for the entire corpus.
- ElevenLabs multilingual_v2 is billed by characters. The user picks a tier on their own that comfortably covers ~55 K chars (subscription tiers and pricing change frequently — checked at execution time).
- `--dry-run` prints the exact character count for the current corpus before any credit is spent, so the user can pick the right tier with confidence.

### 8.6 Audio storage in git

Each MP3 ≈ 10–30 KB at the chosen bitrate. Full corpus ≈ 5–8 MB. Tracked in git directly (no Git LFS needed, well under GitHub's 1 GB soft limit per repo).

---

## 9. UI / Visual design

### 9.1 Theme tokens

User-supplied Tailwind v4 token sheet is used **verbatim**, mapped through `index.css`:

```css
@import "tailwindcss";

@theme inline {
  /* user tokens unchanged — see decision log D9 */
}

@layer base {
  body { @apply bg-background text-foreground font-sans antialiased; }
  .font-serif { font-family: var(--font-serif); }
  .font-mono  { font-family: var(--font-mono); }
}
```

### 9.2 Typography

| Use | Family | Why |
|---|---|---|
| UI chrome (buttons, nav, labels) | **Inter** | Friendly, dense, supports Latin-Ext |
| French questions | Inter, semi-bold, 22–24 px | Visual hierarchy — the prompt |
| French answers (verbatim Ministry text) | **Merriweather**, 18–20 px | Serif "reading" register fits the formal civic register |
| Arabic (all sizes) | **Noto Sans Arabic**, 16–18 px | Best on-screen Arabic, free, broad coverage |
| Source citations on About | **JetBrains Mono**, 14 px | Tiny, factual feel |

All fonts shipped via `@fontsource` (subsetted Latin and Arabic ranges) and self-hosted from `/public/fonts/`. No Google Fonts CDN at runtime. `font-display: swap`.

### 9.3 French flag treatment (per D10)

1. **Card edge** — `<FlagAccent />` component: a 4 px-wide vertical strip on the left edge of every flashcard, three equal segments top-to-bottom: bleu `#0055A4`, blanc `#FFFFFF`, rouge `#EF4135`. Stays static during the 3D flip (it's outside the flipping inner element). Renders as one element with three stacked `<div>`s or a CSS `linear-gradient`.
2. **Header underline** — under the app title `Livret du Citoyen / كتيب المواطن`, a 24 px wide horizontal tricolor: three 8 px segments side-by-side, 2 px tall.
3. **Favicon** — SVG: indigo letters `LC` with a tricolor underscore.

### 9.4 Flashcard layout (front)

```
┌─┬───────────────────────────────────────────────┐
│ │  Valeurs · 3 / 18                             │  ← theme + position, muted small
│ │                                               │
│B│  Avez-vous le droit de tout dire,             │  ← Inter 22–24px semi-bold
│l│  de tout exprimer publiquement ?              │     French, dir="ltr"
│a│                                               │
│n│             [▶ Écouter]  ← AudioButton(fr_q)  │
│c│                                               │
│ │  ──────────                                   │  ← divider, --border
│R│                                               │
│ │  ؟ هل يحق لك قول كل شيء، التعبير عن            │  ← Noto Sans Arabic 18px
│ │              كل شيء علناً                     │     dir="rtl", muted-foreground
│ │                                               │
│ │  Tap to reveal · اضغط لكشف الإجابة            │  ← centered hint, --muted
└─┴───────────────────────────────────────────────┘
```

### 9.5 Flashcard layout (back)

```
┌─┬───────────────────────────────────────────────┐
│ │  Valeurs · 3 / 18                             │
│ │                                               │
│B│  Oui, la liberté d'expression est un          │  ← Merriweather 18–20px
│l│  droit fondamental. Cependant, elle a         │     French, dir="ltr"
│a│  des limites, pour respecter les droits       │
│n│  des autres. Il est ainsi interdit de         │
│c│  diffuser des injures, des propos             │
│ │  diffamatoires, des provocations à la         │
│R│  haine, ou de faire l'apologie de             │
│ │  crimes contre l'humanité.                    │
│ │                                               │
│ │             [▶ Écouter]  ← AudioButton(fr_a)  │
│ │                                               │
│ │  ──────────                                   │
│ │                                               │
│ │   نعم، حرية التعبير حق أساسي. ومع ذلك،         │  ← Noto Sans Arabic
│ │           لها حدود لاحترام حقوق الآخرين       │     dir="rtl"
│ │                                               │
│ │  ┌──────────────────┐ ┌──────────────────┐    │
│ │  │ ✓ Je sais        │ │ ✗ À revoir       │    │  ← ResponseButtons
│ │  │   أعرف           │ │   أحتاج مراجعة   │    │
│ │  └──────────────────┘ └──────────────────┘    │
└─┴───────────────────────────────────────────────┘
```

### 9.6 Sizing & overflow

- **Mobile (< 640 px):** card = `100% - 16px` gutter, min-height `60vh`.
- **Tablet/Desktop (≥ 640 px):** card max-width `720px`, centered, min-height `480px`.
- If answer text exceeds the card's visible height: scroll **inside** the card body (not the whole page), with a 24 px gradient fade at the bottom edge as a scroll affordance.
- Card shadow uses user-supplied tokens (`--shadow-blur 8px`, `--shadow-offset-y 4px`, `--shadow-opacity 0.1`).

### 9.7 Flip animation

```css
.flashcard {
  perspective: 1200px;
}
.flashcard-inner {
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.flashcard-inner.flipped { transform: rotateY(180deg); }
.face { backface-visibility: hidden; }
.face-back { transform: rotateY(180deg); }

@media (prefers-reduced-motion: reduce) {
  .flashcard-inner { transition: opacity 200ms ease; transform: none !important; }
  .face-back { display: none; }
  .flipped .face-front { display: none; }
  .flipped .face-back { display: block; transform: none; }
}
```

### 9.8 Audio button

- Round 40 px button, primary indigo bg, white play icon (lucide `Play`).
- States: idle / loading (spinner) / playing (square stop icon) / paused / error (small alert dot for 2 s).
- On click: starts an HTMLAudioElement playing `/audio/<sha1>.mp3`. Click again → stop & reset. Card flip → stop and reset.
- Only one audio element plays site-wide at a time (managed by a tiny global pubsub hook in `lib/audio.ts`).
- `aria-label="Écouter la question en français"` on front, `Écouter la réponse en français` on back.

### 9.9 Home screen (deck picker)

- Header: app title bilingual + tricolor underline + dark-mode toggle + About link.
- Subhead: *"Choisissez un thème · اختر موضوعًا"*.
- 6 deck tiles, **2 cols mobile, 3 cols desktop**:
  - Theme icon (32 px lucide).
  - Label French (Inter 16 px semibold) + label Arabic (Noto 14 px below, RTL).
  - **Progress ring** showing `known / total`, indigo arc.
  - One-line description below.
  - `accentClass` tints the tile bg.
- `[ ↻ Tout mélanger · خلط الكل ]` button at the bottom.
- Footer with attribution (D16) and link to `/about`.

### 9.10 Study session screen (`/study/:theme` and `/study/all`)

- Top bar: ← back, theme name, **progress dots row** (filled = known, ring = review, empty = unseen), shuffle toggle.
- Center: the `<Flashcard />`.
- Bottom: `← Précédent` / `Carte 3 / 18` / `Suivant →`. Hidden once the user has clicked Je sais on the back (auto-advance fires).
- **Keyboard shortcuts (desktop):** `Space` flip, `←` `→` navigate, `1` Je sais, `2` À revoir, `S` shuffle.
- **Touch (mobile):** swipe left/right for prev/next, tap to flip.
- When the deck is finished (every card answered at least once): show a celebratory screen *"Bravo ! Vous avez parcouru toutes les cartes."* with options to restart or revisit only `À revoir` cards.

### 9.11 About screen (`/about`)

- Sources block: links to the original Ministry PDFs, with explanatory text.
- Privacy block: *"Aucun compte. Aucun cookie. Aucun traceur. Vos progrès restent dans votre navigateur."*
- License block: D16 attribution + GitHub repo link.
- "Réinitialiser le progrès" button (with confirmation Dialog).
- Settings: dark mode (system / light / dark), auto-advance after Je sais (toggle).

### 9.12 Header / Footer

- **Header** sticky on mobile, fixed-top on desktop. Logo + title + tricolor underline + dark-mode toggle + About icon.
- **Footer** shows D16 attribution + version + GitHub link.

---

## 10. Component breakdown

| Component | Responsibility | Inputs | Notes |
|---|---|---|---|
| `<App>` | Mount router, providers | — | Wraps `<ThemeProvider>` and `<ProgressProvider>` |
| `<Header>` | Title, tricolor, dark-mode toggle | — | Sticky on mobile |
| `<Footer>` | Attribution | — | |
| `<DeckPicker>` | Renders 6 `<DeckTile>`s | `themes` registry | Reads progress to compute counts |
| `<DeckTile>` | One theme card | `theme`, `progress: {known, total}` | Click navigates to `/study/:theme` |
| `<DeckProgressRing>` | SVG ring | `value`, `max` | Pure |
| `<StudySession>` | Owns reducer, renders `<Flashcard>` + nav | `cards: Card[]`, `themeId` | Handles keyboard + swipe |
| `<Flashcard>` | The flippable card, owns flip state | `card: Card`, `position`, `total`, `flipped`, `onFlip`, `onResponse` | Pure presentational |
| `<CardFront>` / `<CardBack>` | Side content layout | `card`, derived flags | |
| `<AudioButton>` | Play/stop one MP3 | `sha1`, `lang="fr"` | Uses the shared `useAudioPlayer` hook |
| `<ResponseButtons>` | Je sais / À revoir | `onKnown`, `onReview` | Bilingual labels, large hit targets |
| `<FlagAccent>` | The vertical tricolor | — | Pure CSS, ~10 lines |
| `<DarkModeToggle>` | Sun/moon button | — | Reads/writes `lc.progress.v1.prefs.darkMode` |

Every component has a Vitest unit test for its primary behavior. No component exceeds ~120 lines including imports.

---

## 11. State management

### 11.1 Layers

- **Router state** — `react-router-dom` (URL is the source of truth for "which deck am I on").
- **Session state** — `useReducer` inside `<StudySession>`. Lives only while the screen is mounted.
- **Persistent state** — `localStorage` key `lc.progress.v1`, accessed through a tiny `progress.ts` adapter exposing `getProgress()`, `markKnown(id)`, `markReview(id)`, `getPrefs()`, `setPref(k, v)`, `reset()`.
- **Theme state** — `darkMode` pref + a `useEffect` that toggles `document.documentElement.classList.toggle("dark", …)` on mount and on change.

No Redux. No Zustand. No Jotai. The app is too small to justify them.

### 11.2 Session reducer

```ts
type SessionState = {
  deck: Card[];
  cursor: number;
  flipped: boolean;
  shuffled: boolean;
};

type SessionAction =
  | { type: "FLIP" }
  | { type: "MARK_KNOWN" }     // persists progress + advances if autoAdvance
  | { type: "MARK_REVIEW" }    // persists progress, stays on card
  | { type: "PREV" } | { type: "NEXT" }
  | { type: "JUMP", to: number }
  | { type: "SHUFFLE" }
  | { type: "RESTART", onlyReview?: boolean };
```

`MARK_KNOWN` always calls `progress.markKnown(card.id)`. If `prefs.autoAdvance === true`, it dispatches `NEXT` immediately. (D11)

`MARK_REVIEW` calls `progress.markReview(card.id)` and **does not** advance. (D11)

---

## 12. Routing

`react-router-dom@6` with `HashRouter` (per D8 — no server config needed, works under any subpath).

| Path | Component | Description |
|---|---|---|
| `/` | `<Home>` → `<DeckPicker>` | The deck picker landing |
| `/study/:theme` | `<Study>` → `<StudySession>` | One theme; param validated against `ThemeId.enum` |
| `/study/all` | `<Study>` with all decks merged | Tout mélanger |
| `/about` | `<About>` | Sources, privacy, license, settings, reset |
| `*` | redirect to `/` | Unknown paths bounce home |

---

## 13. Accessibility

- Color contrast: every text/background pair ≥ 4.5:1 (WCAG AA), verified manually + Playwright visual snapshot in CI.
- Card flip announces side change to screen readers via `aria-live="polite"` region: *"Réponse révélée"* / *"تم كشف الإجابة"*.
- All interactive elements reachable by keyboard (`Tab`), with a visible focus ring (`--ring` token).
- Audio buttons have `aria-label` and visible focus state. They expose play/pause state via `aria-pressed`.
- `prefers-reduced-motion: reduce` honored: flip → crossfade, deck transitions instant.
- `prefers-color-scheme` respected by default (overridable via toggle).
- Arabic spans: `dir="rtl" lang="ar"` so screen readers (VoiceOver, NVDA, TalkBack) switch voice & reading direction correctly.
- Tap targets ≥ 44×44 px (Apple HIG / WCAG 2.5.5).
- No autoplay audio. User always initiates playback.

---

## 14. Internationalization

- The app frame and chrome are **French-first** (it is a French citizenship study tool).
- Arabic appears **alongside** French as a translation aid, not as an alternate locale. No `i18next`. The bilingual strings are inline in components.
- Each Arabic span gets `dir="rtl" lang="ar"`. Surrounding LTR layout is preserved.
- The `<html>` root stays `dir="ltr" lang="fr"`.

---

## 15. Testing strategy (right-sized)

| Layer | Tool | Coverage |
|---|---|---|
| **Unit** | Vitest | `progress.ts` get/mark/reset round-trip; `shuffle.ts` Fisher–Yates correctness; `audio.ts` sha1 helper; `card.ts` Zod accepts valid + rejects invalid samples |
| **Component** | Vitest + RTL + jsdom | Flashcard flips on tap and on Space; AudioButton calls play; ResponseButtons fire correct callbacks; CardBack renders Arabic with `dir="rtl"`; FlagAccent renders three colored segments; DeckTile shows correct progress |
| **Integration / E2E** | Playwright | Pick deck → flip 3 cards → mark mixed → reload → progress survives → reset progress → progress empty. Tested on 1 desktop viewport (1280×800) + 1 mobile (iPhone SE 375×667) + 1 tablet (iPad 820×1180). RTL Arabic text is asserted to render right-aligned. Reduced-motion variant tested via Playwright `reducedMotion: "reduce"`. |
| **Schema** | `pnpm validate:cards` in CI | Zod parses every JSON; every audio sha1 has a matching MP3 file in `public/audio/` |
| **Lint / Types** | ESLint + `tsc --noEmit` | Pre-commit + CI |
| **Visual regression** | Playwright screenshots | Front + back of one sample card per theme, light + dark, mobile + desktop. Diffs blocked at >0.1% pixel delta. |

`build:audio` is **not** in CI (costs money + needs key). Run locally before each release.

---

## 16. Build & deployment

### 16.1 Local scripts

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "validate:cards": "tsx scripts/validate-cards.ts",
    "build:audio": "tsx scripts/build-audio.ts",
    "extract:source": "tsx scripts/extract-source.ts",
    "draft:cards": "tsx scripts/draft-cards.ts"
  }
}
```

### 16.2 CI (`.github/workflows/ci.yml`)

```yaml
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm validate:cards
      - run: pnpm build
      - if: github.ref == 'refs/heads/main'
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: livret-citoyen
          directory: dist
```

### 16.3 Performance budget

- Initial JS ≤ **150 KB gzipped** (React + Router + tiny shadcn surface + app code).
- Initial CSS ≤ **30 KB gzipped**.
- Each MP3 fetched only when its audio button is clicked (no preload).
- LCP target < **2.0 s** on Slow 4G.
- Lighthouse: **Performance ≥ 95**, **Accessibility ≥ 95**, **Best Practices ≥ 95**, **SEO ≥ 90**.

---

## 17. Privacy, license, attribution

- **Privacy:** no analytics, no cookies, no third-party scripts at runtime. Only `localStorage` for progress and prefs. A short notice appears in `/about`.
- **Code license:** MIT (D13).
- **Arabic translation license:** CC BY-SA 4.0 (D14).
- **French content:** © Ministère de l'Intérieur, public administrative document, cited and linked on `/about`. The footer carries the disclaimer that this is **a non-official application** (D16).
- Repository name suggestion: `livret-citoyen-flashcards` on GitHub under Rami Hanna's account.

---

## 18. Out of scope (v1)

Per D18:

- ❌ User accounts / login / sync
- ❌ Backend / database / API
- ❌ SM-2 or any heavy spaced repetition algorithm
- ❌ Quiz mode (multiple-choice, typed answer)
- ❌ Mock interview / oral simulator
- ❌ Arabic audio (D3 explicit decision)
- ❌ Additional source languages (English, Tamil, Turkish, Mandarin, …)
- ❌ User-created cards
- ❌ Social sharing / leaderboards / comments
- ❌ Notifications / spaced reminders
- ❌ Print or PDF export
- ❌ Analytics / telemetry / error reporting

## 19. Future / v1.1 candidates (not committed)

- **PWA / offline install** (D17). Cheap to add via `vite-plugin-pwa`. Lets users install the app and study offline on the train or in the prefecture waiting room. ~½ day of work; well-scoped follow-up.
- Additional translation languages (English first as a hedge — opens the app to most non-French-speaking applicants).
- Quiz mode with multiple-choice generated from same card pool.

---

## 20. Glossary

| Term | Meaning |
|---|---|
| **Livret** | The 28-page Ministry-published study guide (*Livret du citoyen*) |
| **Charte** | The 2-page Charter of Rights and Duties of the French Citizen, signed at naturalization |
| **DDHC** | Déclaration des Droits de l'Homme et du Citoyen of 1789 |
| **Theme / deck** | One of the six categories of cards (D5) |
| **Card** | A single Q&A pair in French + Arabic, with two French audio clips |
| **`fr_q` / `fr_a` / `ar_q` / `ar_a`** | The four text fields of a card (French question, French answer, Arabic question, Arabic answer) |
| **Content-addressed audio** | Audio MP3 named by `sha1(text)` so changing the text auto-triggers regeneration |
| **Verbatim** | Word-for-word from the source PDF, with no paraphrasing |
| **Hybrid authoring** | 8 official Q&A boxes preserved verbatim; AI drafts the rest; user reviews Arabic only (D2) |

---

## 21. Open questions for user before the implementation plan

1. **GitHub repository name** — `livret-citoyen-flashcards`, or another name you prefer?
2. **Cloudflare Pages project name / subdomain** — what do you want as the `*.pages.dev` URL? (e.g., `livret-citoyen.pages.dev`)
3. **ElevenLabs voice ID** — when the time comes (during the "build audio" plan step), you'll provide the voice ID you've chosen.

These three are not blockers for the spec; they can be filled in at execution time.
