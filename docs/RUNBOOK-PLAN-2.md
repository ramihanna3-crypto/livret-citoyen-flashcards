# Plan 2 Runbook — populating the real corpus

Plan 2 builds the offline tooling that turns the Ministère de l'Intérieur PDFs into the full bilingual flashcard corpus + French audio. The implementation tasks (1–11) ship the scripts. **This runbook is what YOU run** to actually produce content using your own API keys.

## Prerequisites

1. **Anthropic API key** — sign up at https://console.anthropic.com/ and create a key.
2. **ElevenLabs API key + Voice ID** — sign up at https://elevenlabs.io/, create a key, and pick a voice from https://elevenlabs.io/app/voice-library. Note the voice ID (a string like `XB0fDUnXU5powFXDhCwa`).
3. **Disk** — ~10 MB free for generated MP3s.
4. **Budget** — drafting ≈ $1–2 with Claude Sonnet at ~80 cards. Audio ≈ $5–15 with ElevenLabs Starter at ~50,000 characters.

## Step 1 — Configure environment

```bash
cp .env.example .env.local
# Edit .env.local:
#   ANTHROPIC_API_KEY=sk-ant-...
#   ELEVENLABS_API_KEY=...
#   ELEVENLABS_VOICE_ID=<your chosen voice>
```

## Step 2 — Extract chunks from the PDFs

```bash
pnpm extract:source
```

Expected: `Extracted ~80 chunks → raw/chunks.json`, with a per-theme breakdown.

You can inspect `raw/chunks.json` directly. Look in particular for `verbatim_question: true` entries — those are the Ministry-authored Q&A boxes that we keep as-is.

> **Note on coarse chunking:** PDF text extraction loses paragraph structure, so some pages may end up as a single coarse chunk covering multiple topics. That's OK — Step 4 (manual review) is where you can split a chunk into multiple cards or skip irrelevant content.

## Step 3 — Draft Arabic translations + French questions

```bash
pnpm draft:cards
```

This calls Claude once per chunk. It writes draft cards to `data/cards-draft/<theme>.json`.

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

If a card's `fr_a` covers multiple topics (a coarse chunk from Step 2), you may want to:

- Edit it down to focus on one topic, OR
- Duplicate the card and split the `fr_a` between the two copies, OR
- Delete the card entirely if redundant.

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

After completion, you should see `public/audio/` populated with ~150–200 MP3s totaling ~5–8 MB.

If you change a French question or answer later, just re-run `pnpm build:audio` — only changed clips are regenerated.

## Step 6 — Validate everything

```bash
pnpm validate:cards
```

(No `SKIP_AUDIO_CHECK=1` this time — the audio files now exist.)

Expected output:

```
✓ valeurs.json: 6 cards
✓ droits-devoirs.json: 8 cards
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
