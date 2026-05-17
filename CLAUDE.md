# CLAUDE.md

Guidance for Claude sessions working on **Livret du Citoyen** — a free, account-free, ad-free flashcard web app that helps refugees and immigrants prepare for the French citizenship (assimilation) interview using the official Ministère de l'Intérieur booklet content.

> The user is Rami Hanna (`ramihanna3@gmail.com`). Communicates in fluent but non-native English; sometimes ESL slips (e.g. "documents" when meaning "interview prep"). Flag interpretation choices transparently rather than guessing silently.

---

## Status — Production

- **Live**: <https://livret-citoyen.com> — custom domain on Cloudflare Pages
- **Repo**: <https://github.com/ramihanna3-crypto/livret-citoyen-flashcards>
- **CI**: `.github/workflows/ci.yml` — runs typecheck, lint, vitest, build, playwright; Cloudflare Pages auto-deploys from `main` via its own Git integration (the Actions-driven deploy job needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets the user hasn't set; the Pages-side integration is what's actually shipping)
- **Worker**: `src/worker/index.ts` — Cloudflare Worker with Durable Object `VisitCounter` at `/api/visits`. Wrangler config in `wrangler.jsonc`

## Tech stack

| | |
| --- | --- |
| Build | Vite (rolldown) |
| Framework | React 19 + TypeScript |
| Styling | Tailwind v4 + shadcn/ui |
| Routing | react-router-dom (`HashRouter`) |
| Validation | Zod |
| Icons | lucide-react (brand icons inlined from simple-icons because lucide doesn't ship WhatsApp/Telegram/Facebook) |
| Edge runtime | Cloudflare Workers + Durable Objects (free tier) |
| Audio | ElevenLabs TTS, pre-generated at build, content-addressed `sha1(text).mp3` in `public/audio/` |
| Testing | vitest (unit + component, 75 tests across 28 files) + playwright (E2E) |

## Repo layout

```
src/
  App.tsx                 # HashRouter shell
  routes/                 # Home, Study, About
  components/
    deck/                 # DeckPicker, DeckTile, StudySession, sessionReducer
    flashcard/            # Flashcard (flip), CardFront, CardBack, FlagAccent
    layout/               # Header, Footer, UsageCount (marquee), Marquee primitive
    share/                # ShareButtons (whole-site)
    ui/                   # shadcn primitives (marquee, etc.)
  lib/                    # Hooks + helpers (see "Conventions" below)
  data/
    ui-strings.json       # All non-French i18n (ar, uk, fa, ps, ht, tr) — UI strings + theme labels
    themes.ts             # Theme registry: id, label_fr, icon, accentClass
    cards/                # Per-theme card data (verbatim French + translations map)
    index.ts              # cardsByTheme()
  worker/
    index.ts              # CF Worker: /api/visits → VisitCounter Durable Object
scripts/                  # extract-source, draft-cards, build-audio, validate-cards
public/audio/             # ~226 pre-generated French MP3 files (tracked in git — see "Gotchas")
docs/                     # DEPLOY.md, design specs, plans
```

## Conventions

- **Stage commits by path, never `git add -A`** — see "Gotchas" below for the incident that prompted this rule.
- **French is canonical and hardcoded** in TSX (`<h2>Choisissez un thème ·</h2>`, etc.). The six other languages live in `src/data/ui-strings.json` and are read via `uiStrings(prefs.language)` from `src/lib/ui-strings.ts`. Render bilingually: French first, then the user's selected language with `<span dir={lang.dir} lang={lang.lang}>`.
- **Type contract for UI strings** is `UiStrings` in `src/lib/ui-strings.ts`. When adding a new string, add the key there and to all six language objects in `ui-strings.json` — TypeScript will error if you forget.
- **Touch the design system, not one-off classes**. Theme tokens (`var(--color-primary)`, `var(--color-foreground)`, etc.) live in `src/index.css`. The app is restrained: pastel `indigo-50` / `dark:indigo-950/30` tile backgrounds, `gray-700` accents. Saturated 600-level colors and rainbow gradients read as fluorescent against this palette — see "Tout mélanger" decision below.
- **Reduced motion**: respect `prefers-reduced-motion: reduce` for any new animation. The flashcard flip, marquee, and `useTiltHover` all handle this. Pattern in `src/lib/useTiltHover.ts`.
- **RTL**: a global `[dir="rtl"] { text-align: right }` rule in `src/index.css` handles every RTL element. To override for a specific element (footer attribution), use inline `style={{ textAlign: "left" }}` — same specificity as the global rule will lose to it; inline wins regardless of layer order.
- **`useTiltHover` returns a ref** — destructure at the call site (`const { ref, style, onMouseMove, onMouseLeave } = useTiltHover()`), don't pass `tilt.ref`. React 19's `react-hooks/refs` rule flags property access on ref-containing objects.

## Commands

```bash
pnpm dev                  # localhost:5173
pnpm typecheck            # tsc on app + scripts + worker tsconfigs
pnpm lint                 # ESLint
pnpm test                 # vitest
pnpm build                # production build → dist/
pnpm validate:cards       # Zod-validate all card JSON
pnpm test:e2e             # Playwright

# Build pipeline (rarely needed — content is locked):
pnpm extract:source       # PDF → text chunks
pnpm draft:cards          # text → draft cards (Anthropic SDK)
pnpm build:audio          # cards → MP3s (ElevenLabs)
```

## Decisions made (with rationale)

These are the choices that shape the app — relevant when adding features or wondering "why is it this way?"

- **No tracking, no cookies, no accounts, no ads.** Visit count is a single global integer in a Cloudflare Durable Object; first visit POSTs (increments), subsequent visits GET. The `lc.visited` flag is in `localStorage`, never sent anywhere. Refused Google AdSense on ethical grounds for a refugee-targeted app.

- **7 languages, French canonical.** fr / ar / uk / fa (Dari) / ps (Pashto) / ht (Haitian Creole) / tr. Per-language `dir` + `lang` attrs everywhere user-facing text appears.

- **Audio is French-only and pre-generated.** No live TTS calls from the browser. Files in `public/audio/` are content-addressed by `sha1(text)`. Audio plays only on French question/answer text (not translations).

- **Share buttons share the entire site URL**, never the current deck. The pre-composed message is per-language (key: `share_message`). Three-block layout: brand line / body / URL, separated by blank lines. WhatsApp's `wa.me` preview page collapses newlines in display, but the actual message that lands in WhatsApp on a phone has them. Source book "Livret du citoyen" is named explicitly in the body — credibility anchor.

- **"Tout mélanger" button is solid `indigo-950`.** Iterated through three versions this session: `var(--color-primary)` (too light in dark mode → indigo-400), `indigo-600 → fuchsia-600` gradient (fluorescent, out of place), `indigo-700` (still too light), settling on `indigo-950 hover:indigo-900`. The lesson: this app's palette is muted; saturated rainbow gradients look like an ad.

- **Footer attribution reads "non-governmental"** (`Application non gouvernementale` / `تطبيق غير حكومي` / etc.) — not "unofficial." "Unofficial" implied fan-made/inferior; "non-governmental" cleanly positions the app as an independent civic project. Translated to all 7 languages, ending each footer line.

- **Footer is left-anchored even for RTL.** Inline `style={{ textAlign: "left" }}` overrides the global `[dir="rtl"]` rule for the footer attribution only. Card content and all other RTL surfaces keep natural right-alignment.

- **Cards (category + study) have a cursor-following 3D tilt** via `useTiltHover`. Reuses the math from the InteractiveProductCard reference the user shared, but extracts only the motion — no copied visuals. The hook respects `prefers-reduced-motion` and is mouse-only (touch is unaffected, so the study-screen swipe gesture still works).

- **Visit counter is a marquee, not a static line.** Compact notation (`37K` not `37,520`), 10% smaller than body text, single foreground color across all slides. Earlier tricolor (bleu/blanc/rouge) was tried and rejected.

## Recent commit trail (this session)

```
143d19f fix: restore public/ assets accidentally swept into previous commit
1674f2e copy: footer attribution "unofficial" → "non-governmental" in all 7 languages
0af818f copy: name the source book "Livret du citoyen" in the share message
758c29e copy: rewrite share message — simplicity emphasis, drop the multilingual tail
595a898 style(deckpicker): darken button background by ~50%
8cbd578 style(deckpicker): replace fluorescent gradient with solid deep indigo
e8d46b1 style(deckpicker): replace flat primary with indigo→fuchsia gradient
ef5bb50 feat: cursor-following 3D tilt + lift on category and study cards
e96cf77 refine: restructure share message into three line-separated blocks
6bfa1ef feat: whole-site share buttons on Home and deck-finish screens
6284464 fix(footer): use inline textAlign:left to defeat global [dir=rtl] rule
40fdfa3 refine: revert visit-counter slides to white, shrink text 10%, compact digits
93a1966 feat: tricolor slide cycle + pill-styled digits on visit counter
14cee5a feat: replace static visit counter with multilingual scrolling marquee
661bbd2 feat: privacy-respecting visitor counter on home page
```

## Gotchas — read before you commit

- **`git add -A` is dangerous in this repo.** Commit `1674f2e` accidentally deleted 229 files (`public/audio/*.mp3`, `favicon.svg`, `og.svg`) because they were missing from the working tree before the session and got swept into the staged set. Recovered in `143d19f`. **Stage by path** for any focused change: `git add src/data/ui-strings.json src/components/layout/Footer.tsx`.

- **`public/audio/*.mp3` is tracked in git, not `.gitignore`.** ~226 files. If they disappear locally, restore with `git checkout HEAD -- public/audio`.

- **CI's `deploy` job will fail until the user adds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.** The actual deploys happen via Cloudflare Pages' own Git integration (set up in the Pages dashboard), so this failure doesn't break the live site. Don't try to "fix" it without asking.

- **The CI workflow needs Node 22+** (pnpm 11 requires `node:sqlite` which is 22.13+). `.github/workflows/ci.yml` is already configured; if you bump pnpm, double-check Node version compatibility.

- **The `pages.dev` subdomain `livret-citoyen.pages.dev` is NOT this app.** That subdomain was claimed by someone else; the production URL is `livret-citoyen.com` (custom domain). Probing `pages.dev` returns unrelated HTML.

- **`react-hooks/refs` is enabled and strict.** When consuming any hook that returns a `ref`, destructure into plain locals — don't pass `obj.ref` directly.

## Next steps (queued, in priority order)

1. **Email setup at `contact@livret-citoyen.com`** — Cloudflare Email Routing (free, forwarding only) + Gmail's "Send mail as" so the user can send from that address through their existing Gmail. Plan documented in past conversation. **No code change yet.**

2. **"Contact" mailto link in the footer** — 2-minute edit to `src/components/layout/Footer.tsx`, blocked on the email address actually existing. Add a third `<p>` with `<a href="mailto:contact@livret-citoyen.com?subject=Livret%20du%20Citoyen">Contact</a>`.

3. **Outreach to ~15 NGOs** — France Terre d'Asile, La Cimade, Forum Réfugiés-Cosi, JRS France, Singa, Wintegreat, OFII, plus a few language-specific (Ukrainian Coordination Committee, AFRANE for Afghan refugees, Haitian community associations, ATIB for Turkish). Personal messages, not automated. Drafting an outreach email template is the next concrete deliverable when the user is ready.

4. **(Maybe) Share buttons on the About page** — third high-intent moment. Lower priority than the two above.

## Working style

- **Be honest about substitutions.** When the user says "documents" and means "interview prep," fix it but flag it. When wa.me's preview is misleading them, explain the underlying behavior rather than try-changing things and hoping.
- **Gates: typecheck ✓ / lint ✓ / test ✓ / build ✓** before every push. The user doesn't run them locally before reporting feedback — broken `main` would surface as broken `livret-citoyen.com` within ~60 seconds.
- **Commit messages** include a quoted snippet of the user's request that motivated the change. The commit log is the project history; the user goes back and reads it.
- **Co-authored-by** line at the bottom of every commit: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
