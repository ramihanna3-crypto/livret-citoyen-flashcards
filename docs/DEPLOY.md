# Cloudflare Pages deployment

## One-time setup

1. Push the repo to GitHub: `gh repo create livret-citoyen-flashcards --public --source=. --push`
2. Sign in at https://dash.cloudflare.com/?to=/:account/pages.
3. **Workers & Pages → Create → Pages → Connect to Git** → select the GitHub repo.
4. Build settings:
   - Framework preset: **Vite**
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Root directory: `/`
   - Node version: `20`
5. Click **Save and Deploy**. The site is live at `https://livret-citoyen.pages.dev` after the first build.

## CI-driven deploys (GitHub Actions)

The `ci.yml` workflow needs two repository secrets:

- `CLOUDFLARE_API_TOKEN` — create at https://dash.cloudflare.com/profile/api-tokens with the **Edit Cloudflare Workers** template (or scoped: Account → Cloudflare Pages → Edit).
- `CLOUDFLARE_ACCOUNT_ID` — visible on the right side of the Cloudflare dashboard URL.

Add both via `gh secret set CLOUDFLARE_API_TOKEN` and `gh secret set CLOUDFLARE_ACCOUNT_ID` (or in Settings → Secrets and variables → Actions).

## Local production preview

```bash
pnpm build
pnpm preview
# open http://localhost:4173
```

## Custom domain (later)

In Cloudflare Pages → project → **Custom domains** → add the domain. Cloudflare guides you through the DNS records. Free.
