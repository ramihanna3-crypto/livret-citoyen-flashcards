# Livret du Citoyen — Bilingual Flashcards

A free, ad-free, account-free web app that drills the verbatim contents of the official French citizenship study materials (_Livret du citoyen_ + _Charte des droits et devoirs_) with Arabic translations as a comprehension aid.

**For Arabic-speaking applicants for French naturalization.**

🌐 Live: https://livret-citoyen.pages.dev (set up after Plan 1 deploy)

## Features

- 🇫🇷 **Verbatim French** content from Ministry of Interior PDFs
- 🇸🇦 **Arabic translations** alongside every question and answer
- 🔊 **French audio** on every card (pre-generated via ElevenLabs)
- 📂 **Six themed decks**: Valeurs, Droits & devoirs, Institutions, Histoire, Géographie, DDHC 1789
- ✓✗ **Light progress tracking** — Je sais / À revoir, persisted in `localStorage`
- 🌙 **Dark mode** (system / light / dark)
- 📱 Mobile-first, responsive
- ⌨️ Keyboard shortcuts: `Space` flip, `←` `→` navigate, `1` Je sais, `2` À revoir, `S` shuffle
- ♿ Accessible: WCAG AA contrast, `dir="rtl"` Arabic, `prefers-reduced-motion` honored

## Tech stack

Vite, React 19, TypeScript, Tailwind v4, shadcn/ui, react-router-dom (HashRouter), Zod, lucide-react.

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
data/cards-draft/          ← AI-drafted cards awaiting human review (gitignored)
```

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md).

## License

- Code: MIT
- Arabic translations: CC BY-SA 4.0 — Rami Hanna
- French content: © Ministère de l'Intérieur (public administrative document)

This is a **non-official application**. Authoritative source: https://www.immigration.interieur.gouv.fr.
