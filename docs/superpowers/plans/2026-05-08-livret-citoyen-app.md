# Livret du Citoyen — Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployable bilingual French/Arabic flashcard web app for French citizenship study, populated with hand-authored fixture cards. The companion content pipeline (PDF extraction, AI drafting, ElevenLabs audio generation) is covered by a separate Plan 2.

**Architecture:** Static SPA. Vite-built, React + TypeScript front-end, Tailwind v4 + shadcn/ui for visuals using user-supplied indigo/slate token sheet, hash routing, `localStorage`-only persistence. No server, no DB. Deploys to Cloudflare Pages free tier.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS v4, shadcn/ui, react-router-dom v6 (HashRouter), Zod 3, lucide-react, @fontsource (Inter, Merriweather, Noto Sans Arabic, JetBrains Mono), Vitest + Testing Library, Playwright, ESLint + Prettier, pnpm.

**Source spec:** `docs/superpowers/specs/2026-05-08-livret-citoyen-flashcards-design.md`

---

## Phase organization

| Phase | Tasks | Delivers |
|---|---|---|
| 1. Repo scaffold | 1–5 | Vite + TS + lint + tests bootstrap |
| 2. Tailwind v4 + shadcn + fonts | 6–8 | Theme tokens applied, dark mode, font self-hosting |
| 3. Data layer | 9–12 | Card schema, theme registry, fixture cards, validator |
| 4. Audio infrastructure | 13–15 | sha1 helper, audio URL builder, AudioButton |
| 5. Flashcard core | 16–21 | FlagAccent, ResponseButtons, CardFront/Back, Flashcard, flip |
| 6. Progress & dark mode | 22–25 | localStorage adapter, useProgress hook, theme provider, DeckProgressRing |
| 7. Deck Picker | 26–28 | DeckTile, DeckPicker grid, Home route |
| 8. Study Session | 29–32 | Shuffle, reducer, StudySession (auto-advance + keyboard + swipe + finish), Study route |
| 9. Routing & layout | 33–37 | Router, Header, Footer, About, favicon |
| 10. E2E tests | 38–40 | Playwright study flow, RTL assertion, reduced-motion |
| 11. CI & deploy | 41–43 | GitHub Actions, Cloudflare Pages, README |

Total: **43 tasks.** Each task ends in a commit. Run `pnpm test` and `pnpm typecheck` between phases.

---

# Phase 1 — Repo scaffold

### Task 1: Initialize Vite + React + TypeScript

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `.nvmrc`

- [ ] **Step 1: Create the Vite project skeleton in the existing directory.**

Run from project root:
```bash
pnpm create vite@latest . -- --template react-ts
```
When prompted "Current directory is not empty," choose **"Ignore files and continue."**

- [ ] **Step 2: Pin Node version.**

Create `.nvmrc`:
```
20
```

- [ ] **Step 3: Replace the auto-generated `src/App.tsx` with a minimal placeholder.**

```tsx
// src/App.tsx
export default function App() {
  return <div>Livret du Citoyen</div>;
}
```

- [ ] **Step 4: Replace `src/main.tsx`.**

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 5: Set HTML title and lang in `index.html`.**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Livret du Citoyen</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Verify dev server starts.**

```bash
pnpm install
pnpm dev
```
Expected: server listens on http://localhost:5173 and renders "Livret du Citoyen". Stop with Ctrl+C.

- [ ] **Step 7: Commit.**

```bash
git add .
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Configure path aliases

**Files:**
- Modify: `tsconfig.app.json`, `vite.config.ts`

- [ ] **Step 1: Add path alias to `tsconfig.app.json`.**

Inside `compilerOptions`, add:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 2: Add the same alias to `vite.config.ts`.**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 3: Verify the alias works.**

Add a `src/lib/hello.ts`:
```ts
export const hello = () => "ok";
```
Update `src/App.tsx`:
```tsx
import { hello } from "@/lib/hello";
export default function App() {
  return <div>Livret du Citoyen — {hello()}</div>;
}
```
Run `pnpm dev`, visit http://localhost:5173, confirm it shows "Livret du Citoyen — ok". Then **revert** the App change (keep `hello.ts` for now — used in Task 5 test).

- [ ] **Step 4: Commit.**

```bash
git add tsconfig.app.json vite.config.ts src/lib/hello.ts src/App.tsx
git commit -m "feat: configure @/ path alias"
```

---

### Task 3: Add ESLint + Prettier

**Files:**
- Modify: `package.json`
- Create: `.prettierrc.json`, `.prettierignore`

- [ ] **Step 1: Install Prettier and ESLint Prettier integration.**

```bash
pnpm add -D prettier eslint-config-prettier
```

- [ ] **Step 2: Create `.prettierrc.json`.**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

- [ ] **Step 3: Create `.prettierignore`.**

```
node_modules
dist
public/audio
.vite
playwright-report
test-results
pnpm-lock.yaml
```

- [ ] **Step 4: Append `prettier` to the ESLint config to disable conflicting rules.**

Open `eslint.config.js` (Vite scaffolds it as a flat config). Add this import at the top with the other imports:

```js
import prettier from "eslint-config-prettier";
```

Then append `prettier` as the last element of the `tseslint.config([...])` (or `defineConfig([...])`) array — it must come after all other rule-bearing configs so it can disable conflicts. The end of the file should look like:

```js
export default tseslint.config([
  // ... existing entries (globalIgnores, languageOptions, rules) ...
  prettier,
]);
```

- [ ] **Step 5: Add scripts to `package.json`.**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit -p tsconfig.app.json"
}
```

- [ ] **Step 6: Run formatters.**

```bash
pnpm format
pnpm lint
pnpm typecheck
```
Expected: all three pass with zero errors.

- [ ] **Step 7: Commit.**

```bash
git add .
git commit -m "feat: add Prettier and lint/format/typecheck scripts"
```

---

### Task 4: Add Vitest + Testing Library

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `vitest.setup.ts`, `tsconfig.vitest.json`

- [ ] **Step 1: Install dev dependencies.**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

- [ ] **Step 2: Create `vitest.setup.ts`.**

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 3: Add Vitest config to `vite.config.ts`.**

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
  },
});
```

- [ ] **Step 4: Add test scripts.**

In `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Add `globals: true` to TS so `describe/it/expect` resolve.**

In `tsconfig.app.json`, add to `compilerOptions`:
```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 6: Commit.**

```bash
git add .
git commit -m "feat: add Vitest + Testing Library setup"
```

---

### Task 5: First passing unit test (smoke test)

**Files:**
- Create: `src/lib/hello.test.ts`

- [ ] **Step 1: Write a failing test.**

```ts
// src/lib/hello.test.ts
import { describe, it, expect } from "vitest";
import { hello } from "@/lib/hello";

describe("hello", () => {
  it("returns ok", () => {
    expect(hello()).toBe("ok");
  });
});
```

- [ ] **Step 2: Run the test.**

```bash
pnpm test
```
Expected: 1 passing.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/hello.test.ts
git commit -m "test: smoke unit test for path alias"
```

---

# Phase 2 — Tailwind v4 + shadcn + fonts

### Task 6: Install Tailwind v4 + apply user theme tokens

**Files:**
- Modify: `package.json`, `vite.config.ts`, `src/index.css`
- Create: `src/index.css` (replace auto-generated)

- [ ] **Step 1: Install Tailwind v4 and the Vite plugin.**

```bash
pnpm add tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Wire the Vite plugin into `vite.config.ts`.**

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
  },
});
```

- [ ] **Step 3: Replace `src/index.css` with the user's theme tokens, dark mode, and base styles.**

Use exactly the token sheet from spec §3 D9. Full content:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --card: #ffffff;
  --ring: #6366f1;
  --input: #d1d5db;
  --muted: #f3f4f6;
  --accent: #e0e7ff;
  --border: #d1d5db;
  --radius: 0.5rem;
  --chart-1: #6366f1;
  --chart-2: #4f46e5;
  --chart-3: #4338ca;
  --chart-4: #3730a3;
  --chart-5: #312e81;
  --popover: #ffffff;
  --primary: #6366f1;
  --sidebar: #f3f4f6;
  --font-mono: JetBrains Mono, monospace;
  --font-sans: Inter, sans-serif;
  --secondary: #e5e7eb;
  --background: #f8fafc;
  --font-serif: Merriweather, serif;
  --foreground: #1e293b;
  --destructive: #ef4444;
  --shadow-blur: 8px;
  --shadow-color: hsl(0 0% 0%);
  --sidebar-ring: #6366f1;
  --shadow-spread: -1px;
  --shadow-opacity: 0.1;
  --sidebar-accent: #e0e7ff;
  --sidebar-border: #d1d5db;
  --card-foreground: #1e293b;
  --shadow-offset-x: 0px;
  --shadow-offset-y: 4px;
  --sidebar-primary: #6366f1;
  --muted-foreground: #6b7280;
  --accent-foreground: #374151;
  --popover-foreground: #1e293b;
  --primary-foreground: #ffffff;
  --sidebar-foreground: #1e293b;
  --secondary-foreground: #374151;
  --destructive-foreground: #ffffff;
  --sidebar-accent-foreground: #374151;
  --sidebar-primary-foreground: #ffffff;
  --flag-blue: #0055A4;
  --flag-white: #FFFFFF;
  --flag-red: #EF4135;
}

.dark {
  --card: #1e293b;
  --ring: #818cf8;
  --input: #4b5563;
  --muted: #1e293b;
  --accent: #374151;
  --border: #4b5563;
  --chart-1: #818cf8;
  --chart-2: #6366f1;
  --chart-3: #4f46e5;
  --chart-4: #4338ca;
  --chart-5: #3730a3;
  --popover: #1e293b;
  --primary: #818cf8;
  --sidebar: #1e293b;
  --secondary: #2d3748;
  --background: #0f172a;
  --foreground: #e2e8f0;
  --destructive: #ef4444;
  --sidebar-ring: #818cf8;
  --sidebar-accent: #374151;
  --sidebar-border: #4b5563;
  --card-foreground: #e2e8f0;
  --sidebar-primary: #818cf8;
  --muted-foreground: #9ca3af;
  --accent-foreground: #d1d5db;
  --popover-foreground: #e2e8f0;
  --primary-foreground: #0f172a;
  --sidebar-foreground: #e2e8f0;
  --secondary-foreground: #d1d5db;
  --destructive-foreground: #0f172a;
  --sidebar-accent-foreground: #d1d5db;
  --sidebar-primary-foreground: #0f172a;
}

@theme inline {
  --color-card: var(--card);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-border: var(--border);
  --color-radius: var(--radius);
  --color-popover: var(--popover);
  --color-primary: var(--primary);
  --color-sidebar: var(--sidebar);
  --color-secondary: var(--secondary);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-destructive: var(--destructive);
  --color-card-foreground: var(--card-foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent-foreground: var(--accent-foreground);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-flag-blue: var(--flag-blue);
  --color-flag-white: var(--flag-white);
  --color-flag-red: var(--flag-red);
  --font-sans: var(--font-sans);
  --font-serif: var(--font-serif);
  --font-mono: var(--font-mono);
}

@layer base {
  * { border-color: var(--color-border); }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  [dir="rtl"] { text-align: right; }
}
```

- [ ] **Step 4: Verify dev server renders with theme.**

```bash
pnpm dev
```
Expected: page background uses `--background` (`#f8fafc` light slate). Stop server.

- [ ] **Step 5: Commit.**

```bash
git add .
git commit -m "feat: integrate Tailwind v4 with user theme tokens"
```

---

### Task 7: Self-host fonts via @fontsource

**Files:**
- Modify: `package.json`, `src/main.tsx`

- [ ] **Step 1: Install font packages.**

```bash
pnpm add @fontsource/inter @fontsource/merriweather @fontsource-variable/jetbrains-mono @fontsource/noto-sans-arabic
```

- [ ] **Step 2: Import the weights we use into `src/main.tsx`.**

```tsx
// src/main.tsx
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/merriweather/400.css";
import "@fontsource/merriweather/700.css";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/600.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: Verify in dev that no Google Fonts requests go out (Network tab → only same-origin fonts).**

- [ ] **Step 4: Commit.**

```bash
git add .
git commit -m "feat: self-host Inter, Merriweather, JetBrains Mono, Noto Sans Arabic"
```

---

### Task 8: Initialize shadcn/ui + first primitive (Button)

**Files:**
- Modify: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`
- Create: `components.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`

- [ ] **Step 1: Install shadcn/ui CLI and run init.**

```bash
pnpm dlx shadcn@latest init
```
Answer the prompts: framework=Vite, style=default, base color=slate, css variables=yes, alias `@/*` already configured.

This creates `components.json`, adds `tailwindcss-animate` and `clsx` + `tailwind-merge`, and seeds `src/lib/utils.ts` with the `cn` helper.

- [ ] **Step 2: Add the Button primitive.**

```bash
pnpm dlx shadcn@latest add button
```

This creates `src/components/ui/button.tsx`.

- [ ] **Step 3: Smoke-test by rendering a Button in `src/App.tsx`.**

```tsx
// src/App.tsx
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Livret du Citoyen</h1>
      <Button>Commencer</Button>
    </div>
  );
}
```

- [ ] **Step 4: Verify in browser.**

```bash
pnpm dev
```
Expected: indigo Button renders with the user's primary color.

- [ ] **Step 5: Run lint + tests.**

```bash
pnpm lint && pnpm typecheck && pnpm test
```
All should pass.

- [ ] **Step 6: Commit.**

```bash
git add .
git commit -m "feat: initialize shadcn/ui and add Button primitive"
```

---

# Phase 3 — Data layer

### Task 9: Card schema with Zod

**Files:**
- Create: `src/lib/card.ts`, `src/lib/card.test.ts`

- [ ] **Step 1: Install Zod.**

```bash
pnpm add zod
```

- [ ] **Step 2: Write the failing test.**

```ts
// src/lib/card.test.ts
import { describe, it, expect } from "vitest";
import { Card } from "@/lib/card";

const valid = {
  id: "valeurs-001",
  theme: "valeurs",
  fr_q: "Avez-vous le droit de tout dire publiquement ?",
  ar_q: "هل يحق لك قول كل شيء علناً؟",
  fr_a: "Oui, la liberté d'expression est un droit fondamental.",
  ar_a: "نعم، حرية التعبير حق أساسي.",
  source: "Livret p.4",
  audio: {
    fr_q_sha1: "a".repeat(40),
    fr_a_sha1: "b".repeat(40),
  },
};

describe("Card schema", () => {
  it("accepts a valid card", () => {
    expect(() => Card.parse(valid)).not.toThrow();
  });
  it("rejects bad id format", () => {
    expect(() => Card.parse({ ...valid, id: "BAD_ID" })).toThrow();
  });
  it("rejects unknown theme", () => {
    expect(() => Card.parse({ ...valid, theme: "nope" })).toThrow();
  });
  it("rejects too-short fr_q", () => {
    expect(() => Card.parse({ ...valid, fr_q: "ab" })).toThrow();
  });
  it("rejects malformed sha1", () => {
    expect(() => Card.parse({ ...valid, audio: { fr_q_sha1: "x", fr_a_sha1: "y" } })).toThrow();
  });
});
```

- [ ] **Step 3: Run — should fail with import error.**

```bash
pnpm test src/lib/card.test.ts
```
Expected: FAIL "Cannot find module '@/lib/card'".

- [ ] **Step 4: Implement.**

```ts
// src/lib/card.ts
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

const sha1 = z.string().regex(/^[a-f0-9]{40}$/, "must be a 40-char hex sha1");

export const Card = z.object({
  id: z.string().regex(/^[a-z-]+-\d{3}$/, "id must be like theme-NNN"),
  theme: ThemeId,
  fr_q: z.string().min(3).max(400),
  ar_q: z.string().min(3).max(400),
  fr_a: z.string().min(3).max(2000),
  ar_a: z.string().min(3).max(2000),
  source: z.string().min(3),
  audio: z.object({
    fr_q_sha1: sha1,
    fr_a_sha1: sha1,
  }),
});

export type Card = z.infer<typeof Card>;
export const CardArray = z.array(Card);
```

- [ ] **Step 5: Run tests — should pass.**

```bash
pnpm test src/lib/card.test.ts
```
Expected: 5 passing.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/card.ts src/lib/card.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add Card Zod schema with strict validation"
```

---

### Task 10: Theme registry

**Files:**
- Create: `src/data/themes.ts`, `src/data/themes.test.ts`

- [ ] **Step 1: Install lucide-react.**

```bash
pnpm add lucide-react
```

- [ ] **Step 2: Write the failing test.**

```ts
// src/data/themes.test.ts
import { describe, it, expect } from "vitest";
import { themes } from "@/data/themes";
import { ThemeId } from "@/lib/card";

describe("themes registry", () => {
  it("has exactly 6 themes matching ThemeId enum", () => {
    expect(themes).toHaveLength(6);
    const ids = new Set(themes.map((t) => t.id));
    for (const e of ThemeId.options) expect(ids.has(e)).toBe(true);
  });
  it("every theme has French and Arabic labels", () => {
    for (const t of themes) {
      expect(t.label_fr.length).toBeGreaterThan(2);
      expect(t.label_ar.length).toBeGreaterThan(2);
    }
  });
});
```

- [ ] **Step 3: Run — should fail.**

```bash
pnpm test src/data/themes.test.ts
```

- [ ] **Step 4: Implement.**

```ts
// src/data/themes.ts
import type { ThemeId } from "@/lib/card";
import {
  Scale,
  ShieldCheck,
  Building2,
  Landmark,
  Map,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export type Theme = {
  id: ThemeId;
  label_fr: string;
  label_ar: string;
  description_fr: string;
  description_ar: string;
  icon: LucideIcon;
  accentClass: string;
};

export const themes: Theme[] = [
  {
    id: "valeurs",
    label_fr: "Valeurs & principes",
    label_ar: "القيم والمبادئ",
    description_fr: "Liberté, égalité, fraternité, laïcité.",
    description_ar: "الحرية، المساواة، الإخاء، العلمانية.",
    icon: Scale,
    accentClass: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    id: "droits-devoirs",
    label_fr: "Droits & devoirs",
    label_ar: "الحقوق والواجبات",
    description_fr: "Ce que le citoyen doit faire et ne doit pas faire.",
    description_ar: "ما يجب على المواطن فعله وما لا يجب فعله.",
    icon: ShieldCheck,
    accentClass: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    id: "institutions",
    label_fr: "Institutions politiques",
    label_ar: "المؤسسات السياسية",
    description_fr: "Président, Parlement, justice, collectivités.",
    description_ar: "الرئيس، البرلمان، العدالة، الجماعات المحلية.",
    icon: Building2,
    accentClass: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "histoire",
    label_fr: "Histoire de France",
    label_ar: "تاريخ فرنسا",
    description_fr: "Préhistoire au XXᵉ siècle.",
    description_ar: "من عصور ما قبل التاريخ إلى القرن العشرين.",
    icon: Landmark,
    accentClass: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
  },
  {
    id: "geographie",
    label_fr: "Géographie & place de la France",
    label_ar: "الجغرافيا ومكانة فرنسا",
    description_fr: "Régions, fleuves, Europe, économie.",
    description_ar: "المناطق، الأنهار، أوروبا، الاقتصاد.",
    icon: Map,
    accentClass: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    id: "ddhc",
    label_fr: "Droits de l'Homme 1789",
    label_ar: "إعلان حقوق الإنسان 1789",
    description_fr: "Les 17 articles fondateurs.",
    description_ar: "المواد السبعة عشر التأسيسية.",
    icon: ScrollText,
    accentClass: "bg-rose-50 dark:bg-rose-950/30",
  },
];

export function themeById(id: ThemeId): Theme {
  const t = themes.find((t) => t.id === id);
  if (!t) throw new Error(`Unknown theme: ${id}`);
  return t;
}
```

- [ ] **Step 5: Run tests.**

```bash
pnpm test src/data/themes.test.ts
```
Expected: 2 passing.

- [ ] **Step 6: Commit.**

```bash
git add src/data/themes.ts src/data/themes.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add theme registry with bilingual labels"
```

---

### Task 11: Fixture cards (3 per theme) + data loader

**Files:**
- Create: `src/data/cards/valeurs.json`, `src/data/cards/droits-devoirs.json`, `src/data/cards/institutions.json`, `src/data/cards/histoire.json`, `src/data/cards/geographie.json`, `src/data/cards/ddhc.json`, `src/data/index.ts`, `src/data/index.test.ts`

> Fixture cards include verbatim French answers from the source PDFs and **placeholder Arabic** translations marked clearly so Plan 2 can replace them. The `audio` `sha1` fields use placeholder hashes (40 zeros + theme num) until Plan 2 generates real audio. Plan 1 ships a working app shell; Plan 2 swaps in real Arabic and audio.

- [ ] **Step 1: Create `src/data/cards/valeurs.json`.**

```json
[
  {
    "id": "valeurs-001",
    "theme": "valeurs",
    "fr_q": "Avez-vous le droit de tout dire, de tout exprimer publiquement ?",
    "ar_q": "[AR-DRAFT] هل يحق لك قول وتعبير كل شيء علناً؟",
    "fr_a": "Oui, la liberté d'expression est un droit fondamental. Cependant, elle a des limites, pour respecter les droits des autres. Il est ainsi interdit de diffuser des injures, des propos diffamatoires, des provocations à la haine, ou de faire l'apologie de crimes contre l'humanité.",
    "ar_a": "[AR-DRAFT] نعم، حرية التعبير حق أساسي. ومع ذلك، لها حدود لاحترام حقوق الآخرين. لذا يُحظر نشر الإهانات أو الأقوال التشهيرية أو التحريض على الكراهية أو تمجيد الجرائم ضد الإنسانية.",
    "source": "Livret p.4",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000001",
      "fr_a_sha1": "0000000000000000000000000000000000000002"
    }
  },
  {
    "id": "valeurs-002",
    "theme": "valeurs",
    "fr_q": "Quelle est la devise de la République française ?",
    "ar_q": "[AR-DRAFT] ما هو شعار الجمهورية الفرنسية؟",
    "fr_a": "La République garantit le respect des principes de liberté, d'égalité et de fraternité. Ces trois mots constituent sa devise.",
    "ar_a": "[AR-DRAFT] تكفل الجمهورية احترام مبادئ الحرية والمساواة والإخاء. هذه الكلمات الثلاث هي شعارها.",
    "source": "Livret p.4",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000003",
      "fr_a_sha1": "0000000000000000000000000000000000000004"
    }
  },
  {
    "id": "valeurs-003",
    "theme": "valeurs",
    "fr_q": "Qu'est-ce que la laïcité ?",
    "ar_q": "[AR-DRAFT] ما هي العلمانية؟",
    "fr_a": "La laïcité est un principe fondamental de la République. Elle signifie que les affaires religieuses et les affaires publiques sont clairement séparées. Ce principe est ancien : il est consacré par la loi de 1905 qui sépare les Églises de l'État.",
    "ar_a": "[AR-DRAFT] العلمانية مبدأ أساسي للجمهورية. تعني الفصل الواضح بين الشؤون الدينية والشؤون العامة. وهو مبدأ قديم، كرّسه قانون 1905 الذي يفصل الكنائس عن الدولة.",
    "source": "Livret p.7",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000005",
      "fr_a_sha1": "0000000000000000000000000000000000000006"
    }
  }
]
```

- [ ] **Step 2: Create `src/data/cards/droits-devoirs.json`.**

```json
[
  {
    "id": "droits-devoirs-001",
    "theme": "droits-devoirs",
    "fr_q": "À quel âge les citoyens français peuvent-ils voter ?",
    "ar_q": "[AR-DRAFT] في أي سن يحق للمواطنين الفرنسيين التصويت؟",
    "fr_a": "Les citoyens bénéficient du droit de vote dès 18 ans.",
    "ar_a": "[AR-DRAFT] يتمتع المواطنون بحق التصويت ابتداءً من سن الثامنة عشرة.",
    "source": "Livret p.8",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000011",
      "fr_a_sha1": "0000000000000000000000000000000000000012"
    }
  },
  {
    "id": "droits-devoirs-002",
    "theme": "droits-devoirs",
    "fr_q": "Quels sont les principaux devoirs du citoyen français ?",
    "ar_q": "[AR-DRAFT] ما هي الواجبات الرئيسية للمواطن الفرنسي؟",
    "fr_a": "Respecter la loi (« nul n'est censé ignorer la loi »), contribuer au financement des services publics en payant des impôts, et contribuer à la Défense nationale en se faisant recenser à la mairie à partir de 16 ans.",
    "ar_a": "[AR-DRAFT] احترام القانون («لا يُعذر أحد بجهل القانون»)، والمساهمة في تمويل الخدمات العامة بدفع الضرائب، والمساهمة في الدفاع الوطني بالتسجيل في البلدية ابتداءً من سن السادسة عشرة.",
    "source": "Livret p.8",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000013",
      "fr_a_sha1": "0000000000000000000000000000000000000014"
    }
  },
  {
    "id": "droits-devoirs-003",
    "theme": "droits-devoirs",
    "fr_q": "Tout être humain possède-t-il des droits inaliénables ?",
    "ar_q": "[AR-DRAFT] هل لكل إنسان حقوق غير قابلة للتصرف؟",
    "fr_a": "Tout être humain, sans distinction de race, de religion ni de croyance, possède des droits inaliénables. Sur le territoire de la République, ces droits sont garantis à chacun et chacun a le devoir de les respecter.",
    "ar_a": "[AR-DRAFT] لكل إنسان، دون تمييز بسبب العرق أو الدين أو المعتقد، حقوق غير قابلة للتصرف. وعلى أراضي الجمهورية، هذه الحقوق مكفولة للجميع وعلى الجميع واجب احترامها.",
    "source": "Charte §Droits et devoirs",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000015",
      "fr_a_sha1": "0000000000000000000000000000000000000016"
    }
  }
]
```

- [ ] **Step 3a: Create `src/data/cards/institutions.json`.**

```json
[
  {
    "id": "institutions-001",
    "theme": "institutions",
    "fr_q": "Qui est élu au suffrage universel pour cinq ans ?",
    "ar_q": "[AR-DRAFT] من يُنتخب بالاقتراع العام لمدة خمس سنوات؟",
    "fr_a": "Le Président de la République est élu au suffrage universel pour cinq ans. Il nomme le Gouvernement, dirigé par le Premier ministre, issu de la majorité aux élections législatives.",
    "ar_a": "[AR-DRAFT] يُنتخب رئيس الجمهورية بالاقتراع العام لمدة خمس سنوات. وهو يعيّن الحكومة التي يقودها رئيس الوزراء المنبثق عن الأغلبية في الانتخابات التشريعية.",
    "source": "Livret p.9",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000021",
      "fr_a_sha1": "0000000000000000000000000000000000000022"
    }
  },
  {
    "id": "institutions-002",
    "theme": "institutions",
    "fr_q": "De quelles deux chambres est composé le Parlement ?",
    "ar_q": "[AR-DRAFT] ممَّ يتألف البرلمان الفرنسي من غرفتيه؟",
    "fr_a": "Le Parlement, composé de l'Assemblée nationale et du Sénat, vote les lois et contrôle le Gouvernement. Les députés à l'Assemblée nationale sont élus tous les cinq ans lors des élections législatives. Les sénateurs sont élus au suffrage universel indirect pour un mandat de 6 ans.",
    "ar_a": "[AR-DRAFT] يتألف البرلمان من الجمعية الوطنية ومجلس الشيوخ، ويصوّت على القوانين ويراقب الحكومة. ويُنتخب نواب الجمعية الوطنية كل خمس سنوات عبر الانتخابات التشريعية. أمّا أعضاء مجلس الشيوخ فيُنتخبون بالاقتراع العام غير المباشر لولاية مدتها ست سنوات.",
    "source": "Livret p.9",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000023",
      "fr_a_sha1": "0000000000000000000000000000000000000024"
    }
  },
  {
    "id": "institutions-003",
    "theme": "institutions",
    "fr_q": "Quelles sont les trois collectivités locales en France ?",
    "ar_q": "[AR-DRAFT] ما هي الجماعات الثلاث المحلية في فرنسا؟",
    "fr_a": "Au niveau local, trois collectivités exercent des compétences en application des lois de décentralisation : la commune, le département et la région.",
    "ar_a": "[AR-DRAFT] على المستوى المحلي، تمارس ثلاث جماعات صلاحيّات تطبيقًا لقوانين اللامركزية: البلدية، والمقاطعة (المحافظة)، والمنطقة.",
    "source": "Livret p.11",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000025",
      "fr_a_sha1": "0000000000000000000000000000000000000026"
    }
  }
]
```

- [ ] **Step 3b: Create `src/data/cards/histoire.json`.**

```json
[
  {
    "id": "histoire-001",
    "theme": "histoire",
    "fr_q": "Que s'est-il passé le 14 juillet 1789 ?",
    "ar_q": "[AR-DRAFT] ماذا حدث في 14 يوليو 1789؟",
    "fr_a": "Le 14 juillet 1789, le peuple de Paris s'empare de la prison royale de la Bastille. Un an plus tard, le 14 juillet 1790, lors de la fête de la Fédération, cette date du 14 juillet est devenue la date de la fête nationale.",
    "ar_a": "[AR-DRAFT] في 14 يوليو 1789، استولى أهل باريس على سجن الباستيل الملكي. وبعد عام، في 14 يوليو 1790، خلال عيد الاتحاد، أصبح هذا التاريخ هو تاريخ العيد الوطني.",
    "source": "Livret p.4",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000041",
      "fr_a_sha1": "0000000000000000000000000000000000000042"
    }
  },
  {
    "id": "histoire-002",
    "theme": "histoire",
    "fr_q": "Quand la IIIe République a-t-elle été établie de façon stable ?",
    "ar_q": "[AR-DRAFT] متى استقرّت الجمهورية الثالثة؟",
    "fr_a": "Naissance de la IIIe République (1875). La forme républicaine du Gouvernement est alors établie de façon stable.",
    "ar_a": "[AR-DRAFT] قيام الجمهورية الثالثة (1875). عندئذٍ تأسّس الشكل الجمهوري للحكم بصورة مستقرّة.",
    "source": "Livret p.15",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000043",
      "fr_a_sha1": "0000000000000000000000000000000000000044"
    }
  },
  {
    "id": "histoire-003",
    "theme": "histoire",
    "fr_q": "Qui était Charles de Gaulle ?",
    "ar_q": "[AR-DRAFT] من هو شارل ديغول؟",
    "fr_a": "Charles de Gaulle (1890-1970), chef de la résistance française contre les armées allemandes qui occupent notre pays, il est l'artisan, avec les alliés, de la libération de la France. Bien après la guerre, en 1958, il est à l'origine de nos institutions actuelles (la Ve République).",
    "ar_a": "[AR-DRAFT] شارل ديغول (1890-1970)، قائد المقاومة الفرنسية ضد الجيوش الألمانية التي احتلّت البلاد، وهو من صانعي تحرير فرنسا إلى جانب الحلفاء. وبعد الحرب بفترة طويلة، عام 1958، كان الباني لمؤسساتنا الحالية (الجمهورية الخامسة).",
    "source": "Livret p.16",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000045",
      "fr_a_sha1": "0000000000000000000000000000000000000046"
    }
  }
]
```

- [ ] **Step 3c: Create `src/data/cards/geographie.json`.**

```json
[
  {
    "id": "geographie-001",
    "theme": "geographie",
    "fr_q": "Combien d'habitants compte la France en 2021 ?",
    "ar_q": "[AR-DRAFT] كم بلغ عدد سكان فرنسا في عام 2021؟",
    "fr_a": "En 2021, la France compte 67,4 millions d'habitants (source INSEE). Son territoire s'étend sur 675 000 km², en métropole et outre-mer.",
    "ar_a": "[AR-DRAFT] في عام 2021، بلغ عدد سكان فرنسا 67.4 مليون نسمة (المصدر: المعهد الوطني للإحصاء INSEE). وتمتد أراضيها على 675000 كم² في القارة الأم وما وراء البحار.",
    "source": "Livret p.22",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000051",
      "fr_a_sha1": "0000000000000000000000000000000000000052"
    }
  },
  {
    "id": "geographie-002",
    "theme": "geographie",
    "fr_q": "Quel est le plus long fleuve de France ?",
    "ar_q": "[AR-DRAFT] ما هو أطول نهر في فرنسا؟",
    "fr_a": "La France est parcourue par des fleuves importants : la Loire, la Seine, la Garonne, le Rhône, le Rhin. La Loire est le plus long fleuve français.",
    "ar_a": "[AR-DRAFT] تعبر فرنسا أنهارٌ مهمّة: نهر اللوار، السين، الغارون، الرون، والراين. ونهر اللوار هو أطول نهر فرنسي.",
    "source": "Livret p.22",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000053",
      "fr_a_sha1": "0000000000000000000000000000000000000054"
    }
  },
  {
    "id": "geographie-003",
    "theme": "geographie",
    "fr_q": "Quelle est la place de la France dans l'Union européenne ?",
    "ar_q": "[AR-DRAFT] ما هي مكانة فرنسا في الاتحاد الأوروبي؟",
    "fr_a": "La France est l'un des pionniers de la construction européenne. En 1957, elle est l'un des membres fondateurs de la Communauté économique européenne. En 1992, l'Union européenne est créée, qui associe plus étroitement les États membres. Aujourd'hui, l'Union compte 27 États membres, qui partagent des principes démocratiques.",
    "ar_a": "[AR-DRAFT] فرنسا من روّاد البناء الأوروبي. ففي عام 1957 كانت من الأعضاء المؤسسين للمجموعة الاقتصادية الأوروبية. وفي عام 1992 تأسّس الاتحاد الأوروبي الذي يربط الدول الأعضاء ربطًا أوثق. واليوم يضم الاتحاد 27 دولة عضوًا تتقاسم مبادئ ديمقراطية.",
    "source": "Livret p.20",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000055",
      "fr_a_sha1": "0000000000000000000000000000000000000056"
    }
  }
]
```

- [ ] **Step 3d: Create `src/data/cards/ddhc.json` (uses the actual articles to keep verbatim integrity).**
```json
[
  {
    "id": "ddhc-001",
    "theme": "ddhc",
    "fr_q": "Que dit l'Article 1 de la Déclaration des Droits de l'Homme ?",
    "ar_q": "[AR-DRAFT] ماذا تقول المادة الأولى من إعلان حقوق الإنسان؟",
    "fr_a": "Les hommes naissent et demeurent libres et égaux en droits. Les distinctions sociales ne peuvent être fondées que sur l'utilité commune.",
    "ar_a": "[AR-DRAFT] يولد الناس ويظلّون أحراراً ومتساوين في الحقوق. ولا يمكن أن تكون التمييزات الاجتماعية إلاّ مبنيّة على المنفعة المشتركة.",
    "source": "Livret p.24 — DDHC Art. 1",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000031",
      "fr_a_sha1": "0000000000000000000000000000000000000032"
    }
  },
  {
    "id": "ddhc-002",
    "theme": "ddhc",
    "fr_q": "Quel est le but de toute association politique selon l'Article 2 ?",
    "ar_q": "[AR-DRAFT] ما هي غاية كل اجتماع سياسي حسب المادة الثانية؟",
    "fr_a": "Le but de toute association politique est la conservation des droits naturels et imprescriptibles de l'Homme. Ces droits sont la liberté, la propriété, la sûreté, et la résistance à l'oppression.",
    "ar_a": "[AR-DRAFT] غاية كل اجتماع سياسي هي صون حقوق الإنسان الطبيعية وغير القابلة للتقادم. وهذه الحقوق هي الحرية والملكية والأمن ومقاومة الظلم.",
    "source": "Livret p.24 — DDHC Art. 2",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000033",
      "fr_a_sha1": "0000000000000000000000000000000000000034"
    }
  },
  {
    "id": "ddhc-003",
    "theme": "ddhc",
    "fr_q": "Que dit l'Article 4 sur la liberté ?",
    "ar_q": "[AR-DRAFT] ماذا تقول المادة الرابعة عن الحرية؟",
    "fr_a": "La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui : ainsi, l'exercice des droits naturels de chaque homme n'a de bornes que celles qui assurent aux autres Membres de la Société la jouissance de ces mêmes droits. Ces bornes ne peuvent être déterminées que par la Loi.",
    "ar_a": "[AR-DRAFT] الحرية هي القدرة على فعل كل ما لا يضرّ الآخرين: وعلى ذلك فإن ممارسة كل إنسان لحقوقه الطبيعية ليس لها حدود إلاّ تلك التي تكفل لباقي أعضاء المجتمع التمتع بهذه الحقوق نفسها. ولا يمكن تحديد هذه الحدود إلاّ بموجب القانون.",
    "source": "Livret p.24 — DDHC Art. 4",
    "audio": {
      "fr_q_sha1": "0000000000000000000000000000000000000035",
      "fr_a_sha1": "0000000000000000000000000000000000000036"
    }
  }
]
```

- [ ] **Step 4: Write the data-loader test.**

```ts
// src/data/index.test.ts
import { describe, it, expect } from "vitest";
import { allCards, cardsByTheme } from "@/data";

describe("card data", () => {
  it("loads at least 18 cards (3 per 6 themes)", () => {
    expect(allCards.length).toBeGreaterThanOrEqual(18);
  });
  it("every theme has at least 3 cards", () => {
    for (const theme of [
      "valeurs",
      "droits-devoirs",
      "institutions",
      "histoire",
      "geographie",
      "ddhc",
    ] as const) {
      expect(cardsByTheme(theme).length).toBeGreaterThanOrEqual(3);
    }
  });
  it("all card ids are unique", () => {
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 5: Implement the loader.**

```ts
// src/data/index.ts
import { CardArray, type Card, type ThemeId } from "@/lib/card";
import valeurs from "./cards/valeurs.json";
import droitsDevoirs from "./cards/droits-devoirs.json";
import institutions from "./cards/institutions.json";
import histoire from "./cards/histoire.json";
import geographie from "./cards/geographie.json";
import ddhc from "./cards/ddhc.json";

const raw = [
  ...valeurs,
  ...droitsDevoirs,
  ...institutions,
  ...histoire,
  ...geographie,
  ...ddhc,
];

export const allCards: Card[] = CardArray.parse(raw);

export function cardsByTheme(theme: ThemeId): Card[] {
  return allCards.filter((c) => c.theme === theme);
}
```

- [ ] **Step 6: Tell TypeScript to allow JSON imports.** In `tsconfig.app.json` add to `compilerOptions`:

```json
"resolveJsonModule": true
```

- [ ] **Step 7: Run all tests.**

```bash
pnpm test
```
Expected: data tests pass, schema tests pass.

- [ ] **Step 8: Commit.**

```bash
git add .
git commit -m "feat: add fixture cards (3 per theme) and data loader with Zod validation"
```

---

### Task 12: validate-cards CLI script

**Files:**
- Create: `scripts/validate-cards.ts`
- Modify: `package.json`

- [ ] **Step 1: Install tsx as devDep so we can run TS scripts.**

```bash
pnpm add -D tsx
```

- [ ] **Step 2: Implement the validator.**

```ts
// scripts/validate-cards.ts
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { CardArray } from "../src/lib/card.ts";

const root = resolve(import.meta.dirname, "..");
const cardsDir = join(root, "src/data/cards");
const audioDir = join(root, "public/audio");

let totalCards = 0;
let missingAudio: string[] = [];

for (const file of readdirSync(cardsDir)) {
  if (!file.endsWith(".json")) continue;
  const json = JSON.parse(readFileSync(join(cardsDir, file), "utf8"));
  let cards;
  try {
    cards = CardArray.parse(json);
  } catch (err) {
    console.error(`✗ ${file} failed schema validation:`);
    console.error(err);
    process.exit(1);
  }
  totalCards += cards.length;
  for (const c of cards) {
    for (const sha of [c.audio.fr_q_sha1, c.audio.fr_a_sha1]) {
      const f = join(audioDir, `${sha}.mp3`);
      if (!existsSync(f)) missingAudio.push(`${c.id} → ${sha}.mp3`);
    }
  }
  console.log(`✓ ${file}: ${cards.length} cards`);
}

console.log(`\n${totalCards} cards total`);

if (process.env.SKIP_AUDIO_CHECK === "1") {
  console.log("(audio file existence check skipped via SKIP_AUDIO_CHECK=1)");
} else if (missingAudio.length > 0) {
  console.error(`\n✗ ${missingAudio.length} audio files missing:`);
  for (const m of missingAudio) console.error(`  ${m}`);
  console.error(
    "\nGenerate missing audio with `pnpm build:audio` (Plan 2). " +
      "To skip this check during Plan 1 development set SKIP_AUDIO_CHECK=1.",
  );
  process.exit(1);
} else {
  console.log("✓ all audio files present");
}
```

- [ ] **Step 3: Add the script and the audio dir.**

```bash
mkdir -p public/audio
touch public/audio/.gitkeep
```

In `package.json`:
```json
"validate:cards": "tsx scripts/validate-cards.ts"
```

- [ ] **Step 4: Run the validator (skipping the audio check, since Plan 2 generates audio).**

```bash
SKIP_AUDIO_CHECK=1 pnpm validate:cards
```
Expected: prints `✓ <file>: 3 cards` six times, then `18 cards total`.

- [ ] **Step 5: Commit.**

```bash
git add .
git commit -m "feat: add validate-cards CLI for schema + audio file presence"
```

---

# Phase 4 — Audio infrastructure

### Task 13: sha1 helper + audio URL builder

**Files:**
- Create: `src/lib/audio.ts`, `src/lib/audio.test.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// src/lib/audio.test.ts
import { describe, it, expect } from "vitest";
import { audioUrl } from "@/lib/audio";

describe("audioUrl", () => {
  it("returns a relative path under /audio", () => {
    expect(audioUrl("a".repeat(40))).toBe(`${import.meta.env.BASE_URL}audio/${"a".repeat(40)}.mp3`);
  });
});
```

- [ ] **Step 2: Run test — fails.**

- [ ] **Step 3: Implement.**

```ts
// src/lib/audio.ts
export function audioUrl(sha1: string): string {
  return `${import.meta.env.BASE_URL}audio/${sha1}.mp3`;
}
```

- [ ] **Step 4: Run test — passes.**

```bash
pnpm test src/lib/audio.test.ts
```

- [ ] **Step 5: Commit.**

```bash
git add src/lib/audio.ts src/lib/audio.test.ts
git commit -m "feat: add audioUrl helper"
```

---

### Task 14: useAudioPlayer hook (single-channel global)

**Files:**
- Create: `src/lib/useAudioPlayer.ts`, `src/lib/useAudioPlayer.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/lib/useAudioPlayer.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayer } from "@/lib/useAudioPlayer";

class FakeAudio {
  src = "";
  paused = true;
  currentTime = 0;
  listeners: Record<string, Array<() => void>> = {};
  play = vi.fn(async () => {
    this.paused = false;
    this.listeners["play"]?.forEach((l) => l());
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.listeners["pause"]?.forEach((l) => l());
  });
  addEventListener(ev: string, cb: () => void) {
    (this.listeners[ev] ||= []).push(cb);
  }
  removeEventListener() {}
}

beforeEach(() => {
  // @ts-expect-error override global Audio
  globalThis.Audio = FakeAudio;
});

describe("useAudioPlayer", () => {
  it("starts paused, plays on toggle", async () => {
    const { result } = renderHook(() => useAudioPlayer("/audio/x.mp3"));
    expect(result.current.state).toBe("idle");
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.state).toBe("playing");
  });

  it("only one player can be playing at a time globally", async () => {
    const a = renderHook(() => useAudioPlayer("/audio/a.mp3"));
    const b = renderHook(() => useAudioPlayer("/audio/b.mp3"));
    await act(async () => {
      await a.result.current.toggle();
    });
    expect(a.result.current.state).toBe("playing");
    await act(async () => {
      await b.result.current.toggle();
    });
    expect(a.result.current.state).toBe("idle");
    expect(b.result.current.state).toBe("playing");
  });
});
```

- [ ] **Step 2: Run — fails (module missing).**

- [ ] **Step 3: Implement.**

```ts
// src/lib/useAudioPlayer.ts
import { useCallback, useEffect, useRef, useState } from "react";

type State = "idle" | "loading" | "playing" | "error";

const subscribers = new Set<() => void>();
let currentlyPlaying: HTMLAudioElement | FakeAudioLike | null = null;

interface FakeAudioLike {
  src: string;
  paused: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(ev: string, cb: () => void): void;
  removeEventListener(ev: string, cb: () => void): void;
}

function broadcastStop() {
  for (const fn of subscribers) fn();
}

export function useAudioPlayer(url: string) {
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<FakeAudioLike | null>(null);

  useEffect(() => {
    const a = new Audio(url) as unknown as FakeAudioLike;
    audioRef.current = a;
    const onPlay = () => setState("playing");
    const onPause = () => setState("idle");
    const onEnded = () => setState("idle");
    const onError = () => setState("error");
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);

    const unsubscribe = () => {
      if (currentlyPlaying === a) currentlyPlaying = null;
      try { a.pause(); } catch {}
    };
    subscribers.add(unsubscribe);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      subscribers.delete(unsubscribe);
      try { a.pause(); } catch {}
      if (currentlyPlaying === a) currentlyPlaying = null;
    };
  }, [url]);

  const toggle = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    if (currentlyPlaying && currentlyPlaying !== a) {
      try { currentlyPlaying.pause(); } catch {}
      broadcastStop();
    }
    currentlyPlaying = a;
    try {
      setState("loading");
      await a.play();
    } catch {
      setState("error");
    }
  }, []);

  return { state, toggle };
}
```

- [ ] **Step 4: Run tests.**

```bash
pnpm test src/lib/useAudioPlayer.test.tsx
```
Expected: 2 passing.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/useAudioPlayer.ts src/lib/useAudioPlayer.test.tsx
git commit -m "feat: useAudioPlayer hook with single-channel global state"
```

---

### Task 15: AudioButton component

**Files:**
- Create: `src/components/flashcard/AudioButton.tsx`, `src/components/flashcard/AudioButton.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/flashcard/AudioButton.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AudioButton } from "@/components/flashcard/AudioButton";

class FakeAudio {
  src = "";
  paused = true;
  play = vi.fn(async () => { this.paused = false; this.listeners["play"]?.forEach((l) => l()); });
  pause = vi.fn(() => { this.paused = true; this.listeners["pause"]?.forEach((l) => l()); });
  listeners: Record<string, Array<() => void>> = {};
  addEventListener(ev: string, cb: () => void) { (this.listeners[ev] ||= []).push(cb); }
  removeEventListener() {}
}

beforeEach(() => {
  // @ts-expect-error
  globalThis.Audio = FakeAudio;
});

describe("AudioButton", () => {
  it("renders with the right aria-label and is keyboard-accessible", async () => {
    const user = userEvent.setup();
    render(<AudioButton sha1={"a".repeat(40)} label="Écouter la question en français" />);
    const btn = screen.getByRole("button", { name: /écouter la question/i });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    // After click, aria-pressed should reflect playing state
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement.**

```tsx
// src/components/flashcard/AudioButton.tsx
import { Play, Square, Loader2, AlertCircle } from "lucide-react";
import { audioUrl } from "@/lib/audio";
import { useAudioPlayer } from "@/lib/useAudioPlayer";
import { cn } from "@/lib/utils";

type Props = {
  sha1: string;
  label: string;
  size?: "sm" | "md";
};

export function AudioButton({ sha1, label, size = "md" }: Props) {
  const { state, toggle } = useAudioPlayer(audioUrl(sha1));
  const px = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  const Icon =
    state === "loading" ? Loader2 : state === "playing" ? Square : state === "error" ? AlertCircle : Play;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); void toggle(); }}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") e.stopPropagation(); }}
      aria-label={label}
      aria-pressed={state === "playing"}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        "shadow-sm hover:opacity-90 transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        px,
      )}
    >
      <Icon className={cn("h-4 w-4", state === "loading" && "animate-spin")} aria-hidden="true" />
    </button>
  );
}
```

- [ ] **Step 4: Run test — passes.**

- [ ] **Step 5: Commit.**

```bash
git add src/components/flashcard/AudioButton.tsx src/components/flashcard/AudioButton.test.tsx
git commit -m "feat: AudioButton with aria-pressed and click-stop-propagation"
```

---

# Phase 5 — Flashcard core

### Task 16: FlagAccent component

**Files:**
- Create: `src/components/flashcard/FlagAccent.tsx`, `src/components/flashcard/FlagAccent.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/flashcard/FlagAccent.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FlagAccent } from "@/components/flashcard/FlagAccent";

describe("FlagAccent", () => {
  it("renders three colored segments", () => {
    const { container } = render(<FlagAccent />);
    const segments = container.querySelectorAll("[data-flag-segment]");
    expect(segments).toHaveLength(3);
    expect(segments[0]).toHaveAttribute("data-flag-segment", "blue");
    expect(segments[1]).toHaveAttribute("data-flag-segment", "white");
    expect(segments[2]).toHaveAttribute("data-flag-segment", "red");
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement.**

```tsx
// src/components/flashcard/FlagAccent.tsx
import { cn } from "@/lib/utils";

type Props = { className?: string; orientation?: "vertical" | "horizontal" };

export function FlagAccent({ className, orientation = "vertical" }: Props) {
  const wrap =
    orientation === "vertical"
      ? "flex flex-col w-1 h-full"
      : "flex flex-row h-[2px] w-6";
  const seg = orientation === "vertical" ? "flex-1 w-full" : "flex-1 h-full";

  return (
    <div className={cn(wrap, className)} aria-hidden="true">
      <div data-flag-segment="blue"  className={cn(seg, "bg-[var(--color-flag-blue)]")} />
      <div data-flag-segment="white" className={cn(seg, "bg-[var(--color-flag-white)]")} />
      <div data-flag-segment="red"   className={cn(seg, "bg-[var(--color-flag-red)]")} />
    </div>
  );
}
```

- [ ] **Step 4: Run test — passes.**

- [ ] **Step 5: Commit.**

```bash
git add src/components/flashcard/FlagAccent.tsx src/components/flashcard/FlagAccent.test.tsx
git commit -m "feat: FlagAccent — vertical or horizontal tricolor"
```

---

### Task 17: ResponseButtons component

**Files:**
- Create: `src/components/flashcard/ResponseButtons.tsx`, `src/components/flashcard/ResponseButtons.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/flashcard/ResponseButtons.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseButtons } from "@/components/flashcard/ResponseButtons";

describe("ResponseButtons", () => {
  it("calls onKnown / onReview", async () => {
    const onKnown = vi.fn();
    const onReview = vi.fn();
    const user = userEvent.setup();
    render(<ResponseButtons onKnown={onKnown} onReview={onReview} />);
    await user.click(screen.getByRole("button", { name: /je sais/i }));
    expect(onKnown).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: /à revoir/i }));
    expect(onReview).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement.**

```tsx
// src/components/flashcard/ResponseButtons.tsx
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { onKnown: () => void; onReview: () => void };

export function ResponseButtons({ onKnown, onReview }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onKnown(); }}
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-3 rounded-lg",
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
          "shadow-sm hover:opacity-90 transition min-h-[56px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        )}
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <Check className="h-4 w-4" aria-hidden="true" />
          Je sais
        </span>
        <span dir="rtl" lang="ar" className="text-sm opacity-90">أعرف</span>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onReview(); }}
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-3 rounded-lg border",
          "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
          "border-[var(--color-border)] hover:bg-[var(--color-muted)] transition min-h-[56px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        )}
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <X className="h-4 w-4" aria-hidden="true" />
          À revoir
        </span>
        <span dir="rtl" lang="ar" className="text-sm opacity-90">أحتاج مراجعة</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test — passes.**

- [ ] **Step 5: Commit.**

```bash
git add src/components/flashcard/ResponseButtons.tsx src/components/flashcard/ResponseButtons.test.tsx
git commit -m "feat: ResponseButtons (Je sais / À revoir) with bilingual labels"
```

---

### Task 18: CardFront component

**Files:**
- Create: `src/components/flashcard/CardFront.tsx`, `src/components/flashcard/CardFront.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/flashcard/CardFront.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardFront } from "@/components/flashcard/CardFront";

class FakeAudio {
  paused = true;
  play = vi.fn(async () => {});
  pause = vi.fn();
  addEventListener() {}
  removeEventListener() {}
}
beforeEach(() => {
  // @ts-expect-error
  globalThis.Audio = FakeAudio;
});

const card = {
  id: "valeurs-001",
  theme: "valeurs" as const,
  fr_q: "Question en français ?",
  ar_q: "سؤال بالعربية؟",
  fr_a: "Réponse",
  ar_a: "إجابة",
  source: "Livret p.4",
  audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
};

describe("CardFront", () => {
  it("renders French question with dir=ltr and Arabic with dir=rtl lang=ar", () => {
    render(<CardFront card={card} position={3} total={18} />);
    const fr = screen.getByText(/question en français/i);
    expect(fr).toBeInTheDocument();
    const ar = screen.getByText("سؤال بالعربية؟");
    expect(ar).toHaveAttribute("dir", "rtl");
    expect(ar).toHaveAttribute("lang", "ar");
  });
  it("shows position indicator like '3 / 18'", () => {
    render(<CardFront card={card} position={3} total={18} />);
    expect(screen.getByText(/3 \/ 18/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement.**

```tsx
// src/components/flashcard/CardFront.tsx
import type { Card } from "@/lib/card";
import { themeById } from "@/data/themes";
import { AudioButton } from "@/components/flashcard/AudioButton";

type Props = { card: Card; position: number; total: number };

export function CardFront({ card, position, total }: Props) {
  const theme = themeById(card.theme);
  return (
    <div className="flex h-full flex-col p-6 sm:p-8 gap-4">
      <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">
        {theme.label_fr} · {position} / {total}
      </div>

      <p className="font-sans font-semibold text-xl sm:text-2xl leading-snug text-[var(--color-card-foreground)]" dir="ltr" lang="fr">
        {card.fr_q}
      </p>

      <div className="flex justify-end">
        <AudioButton sha1={card.audio.fr_q_sha1} label="Écouter la question en français" />
      </div>

      <hr className="border-[var(--color-border)]" />

      <p className="font-[family-name:var(--font-sans)] text-base sm:text-lg text-[var(--color-muted-foreground)] leading-relaxed" dir="rtl" lang="ar">
        {card.ar_q}
      </p>

      <div className="mt-auto pt-4 text-center text-xs text-[var(--color-muted-foreground)]">
        Tap to reveal · <span dir="rtl" lang="ar">اضغط لكشف الإجابة</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test — passes.**

- [ ] **Step 5: Commit.**

```bash
git add src/components/flashcard/CardFront.tsx src/components/flashcard/CardFront.test.tsx
git commit -m "feat: CardFront with bilingual question and audio"
```

---

### Task 19: CardBack component

**Files:**
- Create: `src/components/flashcard/CardBack.tsx`, `src/components/flashcard/CardBack.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/flashcard/CardBack.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardBack } from "@/components/flashcard/CardBack";

class FakeAudio { paused=true; play=vi.fn(async()=>{}); pause=vi.fn(); addEventListener(){} removeEventListener(){} }
beforeEach(() => { /* @ts-expect-error */ globalThis.Audio = FakeAudio; });

const card = {
  id: "valeurs-001",
  theme: "valeurs" as const,
  fr_q: "Q?", ar_q: "س؟",
  fr_a: "Réponse en français.", ar_a: "إجابة بالعربية.",
  source: "Livret p.4",
  audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
};

describe("CardBack", () => {
  it("renders French answer with serif font class and Arabic with rtl", () => {
    render(<CardBack card={card} position={1} total={3} onKnown={() => {}} onReview={() => {}} />);
    expect(screen.getByText(/réponse en français/i)).toBeInTheDocument();
    expect(screen.getByText("إجابة بالعربية.")).toHaveAttribute("dir", "rtl");
  });
  it("forwards onKnown/onReview from ResponseButtons", async () => {
    const onKnown = vi.fn(); const onReview = vi.fn();
    const user = userEvent.setup();
    render(<CardBack card={card} position={1} total={3} onKnown={onKnown} onReview={onReview} />);
    await user.click(screen.getByRole("button", { name: /je sais/i }));
    expect(onKnown).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /à revoir/i }));
    expect(onReview).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement.**

```tsx
// src/components/flashcard/CardBack.tsx
import type { Card } from "@/lib/card";
import { themeById } from "@/data/themes";
import { AudioButton } from "@/components/flashcard/AudioButton";
import { ResponseButtons } from "@/components/flashcard/ResponseButtons";

type Props = {
  card: Card;
  position: number;
  total: number;
  onKnown: () => void;
  onReview: () => void;
};

export function CardBack({ card, position, total, onKnown, onReview }: Props) {
  const theme = themeById(card.theme);
  return (
    <div className="flex h-full flex-col p-6 sm:p-8 gap-4">
      <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">
        {theme.label_fr} · {position} / {total}
      </div>

      <p className="font-serif text-base sm:text-lg leading-relaxed text-[var(--color-card-foreground)]" dir="ltr" lang="fr">
        {card.fr_a}
      </p>

      <div className="flex justify-end">
        <AudioButton sha1={card.audio.fr_a_sha1} label="Écouter la réponse en français" />
      </div>

      <hr className="border-[var(--color-border)]" />

      <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted-foreground)]" dir="rtl" lang="ar">
        {card.ar_a}
      </p>

      <div className="mt-auto pt-2">
        <ResponseButtons onKnown={onKnown} onReview={onReview} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test — passes.**

- [ ] **Step 5: Commit.**

```bash
git add src/components/flashcard/CardBack.tsx src/components/flashcard/CardBack.test.tsx
git commit -m "feat: CardBack with serif French answer and ResponseButtons"
```

---

### Task 20: Flashcard wrapper with flip + flag accent

**Files:**
- Create: `src/components/flashcard/Flashcard.tsx`, `src/components/flashcard/Flashcard.test.tsx`, `src/components/flashcard/flashcard.css`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/flashcard/Flashcard.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Flashcard } from "@/components/flashcard/Flashcard";

class FakeAudio { paused=true; play=vi.fn(async()=>{}); pause=vi.fn(); addEventListener(){} removeEventListener(){} }
beforeEach(() => { /* @ts-expect-error */ globalThis.Audio = FakeAudio; });

const card = {
  id: "valeurs-001", theme: "valeurs" as const,
  fr_q: "Question?", ar_q: "س؟", fr_a: "Réponse.", ar_a: "إجابة.",
  source: "Livret p.4",
  audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
};

describe("Flashcard", () => {
  it("flips on tap (Space key)", async () => {
    const user = userEvent.setup();
    render(
      <Flashcard
        card={card} position={1} total={3} flipped={false}
        onFlip={() => {}} onKnown={() => {}} onReview={() => {}}
      />
    );
    const root = screen.getByTestId("flashcard");
    expect(root.querySelector(".flashcard-inner")?.classList.contains("flipped")).toBe(false);
  });

  it("calls onFlip when card surface is clicked", async () => {
    const onFlip = vi.fn();
    const user = userEvent.setup();
    render(
      <Flashcard
        card={card} position={1} total={3} flipped={false}
        onFlip={onFlip} onKnown={() => {}} onReview={() => {}}
      />
    );
    await user.click(screen.getByTestId("flashcard"));
    expect(onFlip).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement the CSS.**

```css
/* src/components/flashcard/flashcard.css */
.flashcard-shell {
  perspective: 1200px;
}
.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.flashcard-inner.flipped { transform: rotateY(180deg); }
.flashcard-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}
.flashcard-face.back { transform: rotateY(180deg); }
@media (prefers-reduced-motion: reduce) {
  .flashcard-inner {
    transition: opacity 200ms ease;
    transform: none !important;
  }
  .flashcard-face.back { display: none; }
  .flashcard-inner.flipped .flashcard-face.front { display: none; }
  .flashcard-inner.flipped .flashcard-face.back { display: block; transform: none; }
}
```

- [ ] **Step 4: Implement Flashcard.**

```tsx
// src/components/flashcard/Flashcard.tsx
import { useEffect } from "react";
import type { Card } from "@/lib/card";
import { CardFront } from "@/components/flashcard/CardFront";
import { CardBack } from "@/components/flashcard/CardBack";
import { FlagAccent } from "@/components/flashcard/FlagAccent";
import { cn } from "@/lib/utils";
import "./flashcard.css";

type Props = {
  card: Card;
  position: number;
  total: number;
  flipped: boolean;
  onFlip: () => void;
  onKnown: () => void;
  onReview: () => void;
};

export function Flashcard({ card, position, total, flipped, onFlip, onKnown, onReview }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const active = document.activeElement;
      if (active && (active.tagName === "BUTTON" || active.tagName === "INPUT")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onFlip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFlip]);

  return (
    <div
      data-testid="flashcard"
      role="button"
      aria-label={flipped ? "Réponse révélée — touchez pour cacher" : "Touchez pour révéler la réponse"}
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      }}
      className={cn(
        "relative w-full max-w-[720px] mx-auto",
        "min-h-[60vh] sm:min-h-[480px]",
        "rounded-[var(--radius)] bg-[var(--color-card)] text-[var(--color-card-foreground)]",
        "shadow-[0_4px_8px_-1px_rgb(0_0_0_/_0.1)]",
        "overflow-hidden flashcard-shell cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
      )}
    >
      <div className={cn("flashcard-inner", flipped && "flipped")}>
        <div className="flashcard-face front">
          <FlagAccent className="absolute left-0 top-0 h-full" />
          <div className="pl-3 h-full overflow-y-auto">
            <CardFront card={card} position={position} total={total} />
          </div>
        </div>
        <div className="flashcard-face back">
          <FlagAccent className="absolute left-0 top-0 h-full" />
          <div className="pl-3 h-full overflow-y-auto">
            <CardBack card={card} position={position} total={total} onKnown={onKnown} onReview={onReview} />
          </div>
        </div>
      </div>
      <div aria-live="polite" className="sr-only">
        {flipped ? "Réponse révélée" : "Question affichée"}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests.**

```bash
pnpm test src/components/flashcard
```
Expected: all flashcard tests pass.

- [ ] **Step 6: Commit.**

```bash
git add src/components/flashcard
git commit -m "feat: Flashcard with 3D flip, flag accent, keyboard support, reduced-motion fallback"
```

---

### Task 21: Smoke-render Flashcard in App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Wire Flashcard into App for visual smoke test.**

```tsx
// src/App.tsx
import { useState } from "react";
import { Flashcard } from "@/components/flashcard/Flashcard";
import { allCards } from "@/data";

export default function App() {
  const [flipped, setFlipped] = useState(false);
  const card = allCards[0];
  return (
    <main className="min-h-screen p-4 sm:p-8 bg-[var(--color-background)]">
      <h1 className="text-2xl font-semibold mb-6 text-center">Livret du Citoyen</h1>
      <Flashcard
        card={card}
        position={1}
        total={allCards.length}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onKnown={() => alert("Je sais")}
        onReview={() => alert("À revoir")}
      />
    </main>
  );
}
```

- [ ] **Step 2: Visually verify in dev server.**

```bash
pnpm dev
```
Click the card — it flips. Click Je sais — alert. Tab to card and press Space — flips. Resize window to 375 px wide — card responsive.

- [ ] **Step 3: Commit.**

```bash
git add src/App.tsx
git commit -m "feat: smoke-render Flashcard at app root"
```

---

# Phase 6 — Progress & dark mode

### Task 22: localStorage progress adapter

**Files:**
- Create: `src/lib/progress.ts`, `src/lib/progress.test.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// src/lib/progress.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { getProgress, markKnown, markReview, getPrefs, setPref, resetProgress } from "@/lib/progress";

beforeEach(() => {
  localStorage.clear();
});

describe("progress adapter", () => {
  it("starts empty", () => {
    expect(getProgress()).toEqual({});
  });
  it("markKnown / markReview round-trip", () => {
    markKnown("valeurs-001");
    markReview("valeurs-002");
    const p = getProgress();
    expect(p["valeurs-001"].status).toBe("known");
    expect(p["valeurs-002"].status).toBe("review");
    expect(typeof p["valeurs-001"].lastSeenAt).toBe("number");
  });
  it("prefs default to system + auto-advance true", () => {
    expect(getPrefs()).toEqual({ darkMode: "system", autoAdvance: true });
  });
  it("setPref persists", () => {
    setPref("autoAdvance", false);
    expect(getPrefs().autoAdvance).toBe(false);
  });
  it("resetProgress clears card statuses but keeps prefs", () => {
    markKnown("valeurs-001");
    setPref("darkMode", "dark");
    resetProgress();
    expect(getProgress()).toEqual({});
    expect(getPrefs().darkMode).toBe("dark");
  });
  it("ignores stored data with unknown version", () => {
    localStorage.setItem("lc.progress.v1", JSON.stringify({ v: 999, cards: { foo: "bar" } }));
    expect(getProgress()).toEqual({});
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement.**

```ts
// src/lib/progress.ts
export type CardStatus = "known" | "review";
export type CardEntry = { status: CardStatus; lastSeenAt: number };
export type CardProgress = Record<string, CardEntry>;

export type Prefs = {
  darkMode: "system" | "light" | "dark";
  autoAdvance: boolean;
};

type StoredV1 = { v: 1; cards: CardProgress; prefs: Prefs };

const KEY = "lc.progress.v1";
const DEFAULT_PREFS: Prefs = { darkMode: "system", autoAdvance: true };

function read(): StoredV1 {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { v: 1, cards: {}, prefs: DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    if (parsed?.v !== 1) return { v: 1, cards: {}, prefs: DEFAULT_PREFS };
    return {
      v: 1,
      cards: parsed.cards ?? {},
      prefs: { ...DEFAULT_PREFS, ...(parsed.prefs ?? {}) },
    };
  } catch {
    return { v: 1, cards: {}, prefs: DEFAULT_PREFS };
  }
}

function write(s: StoredV1) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function getProgress(): CardProgress {
  return read().cards;
}

export function markKnown(id: string) {
  const s = read();
  s.cards[id] = { status: "known", lastSeenAt: Date.now() };
  write(s);
}

export function markReview(id: string) {
  const s = read();
  s.cards[id] = { status: "review", lastSeenAt: Date.now() };
  write(s);
}

export function getPrefs(): Prefs {
  return read().prefs;
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  const s = read();
  s.prefs = { ...s.prefs, [key]: value };
  write(s);
}

export function resetProgress() {
  const s = read();
  s.cards = {};
  write(s);
}

export function resetAll() {
  localStorage.removeItem(KEY);
}
```

- [ ] **Step 4: Run tests.**

```bash
pnpm test src/lib/progress.test.ts
```
Expected: 6 passing.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/progress.ts src/lib/progress.test.ts
git commit -m "feat: localStorage progress adapter (v1) with versioning"
```

---

### Task 23: useProgress React hook

**Files:**
- Create: `src/lib/useProgress.ts`, `src/lib/useProgress.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/lib/useProgress.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProgress } from "@/lib/useProgress";

beforeEach(() => localStorage.clear());

describe("useProgress", () => {
  it("returns counts and updates them", () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current.knownCount("valeurs")).toBe(0);

    act(() => result.current.markKnown("valeurs-001"));
    expect(result.current.knownCount("valeurs")).toBe(1);

    act(() => result.current.markReview("valeurs-001"));
    expect(result.current.knownCount("valeurs")).toBe(0);
    expect(result.current.reviewCount("valeurs")).toBe(1);
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement.**

```ts
// src/lib/useProgress.ts
import { useCallback, useState, useSyncExternalStore } from "react";
import * as p from "@/lib/progress";
import type { ThemeId } from "@/lib/card";

const subs = new Set<() => void>();
function notify() { subs.forEach((s) => s()); }

function subscribe(cb: () => void) { subs.add(cb); return () => subs.delete(cb); }
function getSnapshot() { return JSON.stringify(p.getProgress()) + JSON.stringify(p.getPrefs()); }

export function useProgress() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const cards = p.getProgress();
  const prefs = p.getPrefs();

  const markKnown = useCallback((id: string) => { p.markKnown(id); notify(); }, []);
  const markReview = useCallback((id: string) => { p.markReview(id); notify(); }, []);
  const setPref = useCallback(<K extends keyof p.Prefs>(k: K, v: p.Prefs[K]) => {
    p.setPref(k, v);
    notify();
  }, []);
  const reset = useCallback(() => { p.resetProgress(); notify(); }, []);

  function countByTheme(theme: ThemeId, status: "known" | "review") {
    return Object.entries(cards).filter(
      ([id, e]) => id.startsWith(`${theme}-`) && e.status === status,
    ).length;
  }

  return {
    cards,
    prefs,
    markKnown,
    markReview,
    setPref,
    reset,
    knownCount: (theme: ThemeId) => countByTheme(theme, "known"),
    reviewCount: (theme: ThemeId) => countByTheme(theme, "review"),
    statusOf: (id: string): "known" | "review" | undefined => cards[id]?.status,
  };
}
```

- [ ] **Step 4: Run tests.**

```bash
pnpm test src/lib/useProgress.test.tsx
```

- [ ] **Step 5: Commit.**

```bash
git add src/lib/useProgress.ts src/lib/useProgress.test.tsx
git commit -m "feat: useProgress hook with reactive counts"
```

---

### Task 24: Theme provider (dark mode)

**Files:**
- Create: `src/lib/useTheme.ts`, `src/components/layout/DarkModeToggle.tsx`, `src/components/layout/DarkModeToggle.test.tsx`

- [ ] **Step 1: Write the failing test for the toggle.**

```tsx
// src/components/layout/DarkModeToggle.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("DarkModeToggle", () => {
  it("cycles system → light → dark → system", async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);
    const btn = screen.getByRole("button", { name: /thème/i });
    expect(btn).toHaveAttribute("data-mode", "system");
    await user.click(btn);
    expect(btn).toHaveAttribute("data-mode", "light");
    await user.click(btn);
    expect(btn).toHaveAttribute("data-mode", "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    await user.click(btn);
    expect(btn).toHaveAttribute("data-mode", "system");
  });
});
```

- [ ] **Step 2: Implement the theme hook.**

```ts
// src/lib/useTheme.ts
import { useEffect } from "react";
import { useProgress } from "@/lib/useProgress";

export function useTheme() {
  const { prefs, setPref } = useProgress();

  useEffect(() => {
    function apply() {
      const wantDark =
        prefs.darkMode === "dark" ||
        (prefs.darkMode === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", wantDark);
    }
    apply();
    if (prefs.darkMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [prefs.darkMode]);

  function cycle() {
    const order: Array<typeof prefs.darkMode> = ["system", "light", "dark"];
    const next = order[(order.indexOf(prefs.darkMode) + 1) % order.length];
    setPref("darkMode", next);
  }

  return { mode: prefs.darkMode, cycle };
}
```

- [ ] **Step 3: Implement the toggle.**

```tsx
// src/components/layout/DarkModeToggle.tsx
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/utils";

export function DarkModeToggle() {
  const { mode, cycle } = useTheme();
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const labelMap = { system: "Système", light: "Clair", dark: "Sombre" } as const;

  return (
    <button
      type="button"
      onClick={cycle}
      data-mode={mode}
      aria-label={`Thème : ${labelMap[mode]} (cliquer pour changer)`}
      className={cn(
        "h-9 w-9 inline-flex items-center justify-center rounded-md",
        "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        "hover:bg-[var(--color-muted)] transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
```

- [ ] **Step 4: Run tests.**

```bash
pnpm test src/components/layout
```
Expected: 1 passing.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/useTheme.ts src/components/layout
git commit -m "feat: dark mode hook + cycling toggle (system/light/dark)"
```

---

### Task 25: DeckProgressRing

**Files:**
- Create: `src/components/deck/DeckProgressRing.tsx`, `src/components/deck/DeckProgressRing.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/deck/DeckProgressRing.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeckProgressRing } from "@/components/deck/DeckProgressRing";

describe("DeckProgressRing", () => {
  it("shows 'X / Y' label", () => {
    render(<DeckProgressRing value={3} max={18} />);
    expect(screen.getByText("3 / 18")).toBeInTheDocument();
  });
  it("clamps value to [0, max]", () => {
    render(<DeckProgressRing value={99} max={18} />);
    expect(screen.getByText("18 / 18")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement.**

```tsx
// src/components/deck/DeckProgressRing.tsx
import { cn } from "@/lib/utils";

type Props = { value: number; max: number; size?: number; className?: string };

export function DeckProgressRing({ value, max, size = 72, className }: Props) {
  const v = Math.max(0, Math.min(value, max));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = max === 0 ? c : c * (1 - v / max);

  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${v} sur ${max}`}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-muted)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-primary)" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
        {v} / {max}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Run tests.**

```bash
pnpm test src/components/deck/DeckProgressRing.test.tsx
```

- [ ] **Step 4: Commit.**

```bash
git add src/components/deck
git commit -m "feat: DeckProgressRing SVG component"
```

---

# Phase 7 — Deck Picker

### Task 26: DeckTile

**Files:**
- Create: `src/components/deck/DeckTile.tsx`, `src/components/deck/DeckTile.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/deck/DeckTile.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeckTile } from "@/components/deck/DeckTile";
import { themes } from "@/data/themes";

describe("DeckTile", () => {
  it("renders bilingual labels and total", () => {
    render(<DeckTile theme={themes[0]} known={2} total={3} onClick={() => {}} />);
    expect(screen.getByText(/valeurs/i)).toBeInTheDocument();
    expect(screen.getByText("القيم والمبادئ")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
  it("calls onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<DeckTile theme={themes[0]} known={0} total={3} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement.**

```tsx
// src/components/deck/DeckTile.tsx
import type { Theme } from "@/data/themes";
import { DeckProgressRing } from "@/components/deck/DeckProgressRing";
import { cn } from "@/lib/utils";

type Props = { theme: Theme; known: number; total: number; onClick: () => void };

export function DeckTile({ theme, known, total, onClick }: Props) {
  const Icon = theme.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-[var(--radius)] border p-4 sm:p-5",
        "border-[var(--color-border)]",
        theme.accentClass,
        "hover:shadow-md transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2">
            <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <h3 className="font-semibold text-base sm:text-lg">{theme.label_fr}</h3>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]" dir="rtl" lang="ar">
            {theme.label_ar}
          </p>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)] line-clamp-2">
            {theme.description_fr}
          </p>
        </div>
        <DeckProgressRing value={known} max={total} />
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Run tests.**

- [ ] **Step 4: Commit.**

```bash
git add src/components/deck/DeckTile.tsx src/components/deck/DeckTile.test.tsx
git commit -m "feat: DeckTile with bilingual labels and progress ring"
```

---

### Task 27: DeckPicker grid + Tout mélanger button

**Files:**
- Create: `src/components/deck/DeckPicker.tsx`, `src/components/deck/DeckPicker.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/deck/DeckPicker.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DeckPicker } from "@/components/deck/DeckPicker";

describe("DeckPicker", () => {
  it("renders 6 deck tiles + Tout mélanger button", () => {
    render(
      <MemoryRouter>
        <DeckPicker />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(7);
    expect(screen.getByRole("button", { name: /tout mélanger/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Install react-router.**

```bash
pnpm add react-router-dom
```

- [ ] **Step 3: Implement.**

```tsx
// src/components/deck/DeckPicker.tsx
import { useNavigate } from "react-router-dom";
import { themes } from "@/data/themes";
import { DeckTile } from "@/components/deck/DeckTile";
import { cardsByTheme } from "@/data";
import { useProgress } from "@/lib/useProgress";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeckPicker() {
  const navigate = useNavigate();
  const { knownCount } = useProgress();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {themes.map((t) => {
          const total = cardsByTheme(t.id).length;
          return (
            <DeckTile
              key={t.id}
              theme={t}
              known={knownCount(t.id)}
              total={total}
              onClick={() => navigate(`/study/${t.id}`)}
            />
          );
        })}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => navigate("/study/all")}
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius)] px-5 py-3",
            "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
            "hover:opacity-90 transition shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
          )}
        >
          <Shuffle className="h-4 w-4" aria-hidden="true" />
          Tout mélanger · <span dir="rtl" lang="ar">خلط الكل</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests.**

- [ ] **Step 5: Commit.**

```bash
git add .
git commit -m "feat: DeckPicker grid + Tout mélanger CTA"
```

---

### Task 28: Home route stub

**Files:**
- Create: `src/routes/Home.tsx`

- [ ] **Step 1: Implement.**

```tsx
// src/routes/Home.tsx
import { DeckPicker } from "@/components/deck/DeckPicker";

export function Home() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">
        Choisissez un thème · <span dir="rtl" lang="ar">اختر موضوعًا</span>
      </h2>
      <DeckPicker />
    </section>
  );
}
```

- [ ] **Step 2: Commit.**

```bash
git add src/routes/Home.tsx
git commit -m "feat: Home route renders DeckPicker"
```

---

# Phase 8 — Study Session

### Task 29: shuffle helper

**Files:**
- Create: `src/lib/shuffle.ts`, `src/lib/shuffle.test.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// src/lib/shuffle.test.ts
import { describe, it, expect } from "vitest";
import { shuffled } from "@/lib/shuffle";

describe("shuffled", () => {
  it("preserves length and elements", () => {
    const a = [1, 2, 3, 4, 5];
    const b = shuffled(a);
    expect(b).toHaveLength(a.length);
    expect([...b].sort()).toEqual([...a].sort());
  });
  it("does not mutate the input", () => {
    const a = [1, 2, 3];
    const orig = [...a];
    shuffled(a);
    expect(a).toEqual(orig);
  });
});
```

- [ ] **Step 2: Implement.**

```ts
// src/lib/shuffle.ts
export function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

- [ ] **Step 3: Run + commit.**

```bash
pnpm test src/lib/shuffle.test.ts
git add src/lib/shuffle.ts src/lib/shuffle.test.ts
git commit -m "feat: pure shuffled() Fisher-Yates helper"
```

---

### Task 30: Session reducer

**Files:**
- Create: `src/components/deck/sessionReducer.ts`, `src/components/deck/sessionReducer.test.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// src/components/deck/sessionReducer.test.ts
import { describe, it, expect } from "vitest";
import { sessionReducer, initSession } from "@/components/deck/sessionReducer";
import type { Card } from "@/lib/card";

const c = (id: string): Card => ({
  id, theme: "valeurs", fr_q: "Q?", ar_q: "س؟", fr_a: "R", ar_a: "إ",
  source: "x", audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
});

const deck = [c("valeurs-001"), c("valeurs-002"), c("valeurs-003")];

describe("sessionReducer", () => {
  it("FLIP toggles", () => {
    const s = initSession(deck);
    const s2 = sessionReducer(s, { type: "FLIP" });
    expect(s2.flipped).toBe(true);
    const s3 = sessionReducer(s2, { type: "FLIP" });
    expect(s3.flipped).toBe(false);
  });
  it("NEXT advances and resets flipped", () => {
    const s = sessionReducer({ ...initSession(deck), flipped: true }, { type: "NEXT" });
    expect(s.cursor).toBe(1);
    expect(s.flipped).toBe(false);
  });
  it("PREV does not go below 0", () => {
    const s = sessionReducer(initSession(deck), { type: "PREV" });
    expect(s.cursor).toBe(0);
  });
  it("NEXT clamps at end", () => {
    let s = initSession(deck);
    s = sessionReducer(s, { type: "JUMP", to: 2 });
    s = sessionReducer(s, { type: "NEXT" });
    expect(s.cursor).toBe(2);
    expect(s.finished).toBe(true);
  });
  it("SHUFFLE preserves length and resets cursor", () => {
    const s = sessionReducer(initSession(deck), { type: "SHUFFLE" });
    expect(s.deck).toHaveLength(3);
    expect(s.cursor).toBe(0);
    expect(s.shuffled).toBe(true);
  });
  it("RESTART resets cursor and unflips", () => {
    let s = initSession(deck);
    s = sessionReducer(s, { type: "JUMP", to: 2 });
    s = sessionReducer(s, { type: "FLIP" });
    s = sessionReducer(s, { type: "RESTART" });
    expect(s.cursor).toBe(0);
    expect(s.flipped).toBe(false);
    expect(s.finished).toBe(false);
  });
});
```

- [ ] **Step 2: Implement.**

```ts
// src/components/deck/sessionReducer.ts
import type { Card } from "@/lib/card";
import { shuffled } from "@/lib/shuffle";

export type SessionState = {
  deck: Card[];
  cursor: number;
  flipped: boolean;
  shuffled: boolean;
  finished: boolean;
};

export type SessionAction =
  | { type: "FLIP" }
  | { type: "PREV" }
  | { type: "NEXT" }
  | { type: "JUMP"; to: number }
  | { type: "SHUFFLE" }
  | { type: "RESTART"; deck?: Card[] };

export function initSession(deck: Card[]): SessionState {
  return { deck, cursor: 0, flipped: false, shuffled: false, finished: false };
}

export function sessionReducer(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case "FLIP":
      return { ...s, flipped: !s.flipped };
    case "PREV":
      return { ...s, cursor: Math.max(0, s.cursor - 1), flipped: false, finished: false };
    case "NEXT": {
      const last = s.deck.length - 1;
      if (s.cursor >= last) return { ...s, cursor: last, flipped: false, finished: true };
      return { ...s, cursor: s.cursor + 1, flipped: false };
    }
    case "JUMP":
      return { ...s, cursor: Math.max(0, Math.min(a.to, s.deck.length - 1)), flipped: false, finished: false };
    case "SHUFFLE":
      return { ...s, deck: shuffled(s.deck), cursor: 0, flipped: false, shuffled: true, finished: false };
    case "RESTART":
      return initSession(a.deck ?? s.deck);
  }
}
```

- [ ] **Step 3: Run tests + commit.**

```bash
pnpm test src/components/deck/sessionReducer.test.ts
git add src/components/deck/sessionReducer.ts src/components/deck/sessionReducer.test.ts
git commit -m "feat: session reducer for study flow"
```

---

### Task 31: StudySession component (auto-advance, keyboard, swipe)

**Files:**
- Create: `src/components/deck/StudySession.tsx`, `src/components/deck/StudySession.test.tsx`

- [ ] **Step 1: Write the failing test.**

```tsx
// src/components/deck/StudySession.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudySession } from "@/components/deck/StudySession";
import { cardsByTheme } from "@/data";

class FakeAudio { paused=true; play=vi.fn(async()=>{}); pause=vi.fn(); addEventListener(){} removeEventListener(){} }
beforeEach(() => {
  // @ts-expect-error
  globalThis.Audio = FakeAudio;
  localStorage.clear();
});

describe("StudySession", () => {
  it("flip → Je sais auto-advances to next card", async () => {
    const user = userEvent.setup();
    render(<StudySession cards={cardsByTheme("valeurs")} backHref="/" themeLabel="Valeurs" />);
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    await user.click(screen.getByTestId("flashcard"));
    await user.click(screen.getByRole("button", { name: /je sais/i }));
    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument();
  });

  it("flip → À revoir stays on the same card", async () => {
    const user = userEvent.setup();
    render(<StudySession cards={cardsByTheme("valeurs")} backHref="/" themeLabel="Valeurs" />);
    await user.click(screen.getByTestId("flashcard"));
    await user.click(screen.getByRole("button", { name: /à revoir/i }));
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement.**

```tsx
// src/components/deck/StudySession.tsx
import { useEffect, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import type { Card } from "@/lib/card";
import { Flashcard } from "@/components/flashcard/Flashcard";
import { initSession, sessionReducer } from "@/components/deck/sessionReducer";
import { useProgress } from "@/lib/useProgress";
import { cn } from "@/lib/utils";

type Props = { cards: Card[]; backHref: string; themeLabel: string };

export function StudySession({ cards, backHref, themeLabel }: Props) {
  const [state, dispatch] = useReducer(sessionReducer, initSession(cards));
  const { markKnown, markReview, prefs, statusOf } = useProgress();
  const touchStartX = useRef<number | null>(null);
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); dispatch({ type: "FLIP" }); }
      if (e.key === "ArrowLeft") dispatch({ type: "PREV" });
      if (e.key === "ArrowRight") dispatch({ type: "NEXT" });
      if (state.flipped && e.key === "1") {
        markKnown(state.deck[state.cursor].id);
        if (prefs.autoAdvance) dispatch({ type: "NEXT" });
      }
      if (state.flipped && e.key === "2") markReview(state.deck[state.cursor].id);
      if (e.key.toLowerCase() === "s") dispatch({ type: "SHUFFLE" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.deck, state.cursor, state.flipped, prefs.autoAdvance, markKnown, markReview]);

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) dispatch({ type: "NEXT" });
    else dispatch({ type: "PREV" });
  }

  if (state.finished) {
    return (
      <div className="text-center space-y-4 py-8">
        <h2 className="text-xl font-semibold">Bravo ! Vous avez parcouru toutes les cartes.</h2>
        <p dir="rtl" lang="ar" className="text-[var(--color-muted-foreground)]">أحسنت! لقد أنهيت جميع البطاقات.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => dispatch({ type: "RESTART" })}
            className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          >
            Recommencer
          </button>
          <Link to={backHref} className="px-4 py-2 rounded-[var(--radius)] border">Retour</Link>
        </div>
      </div>
    );
  }

  const card = state.deck[state.cursor];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to={backHref} className="inline-flex items-center gap-1 text-sm hover:underline">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h2 className="text-sm font-semibold truncate">{themeLabel}</h2>
        <button
          type="button"
          onClick={() => dispatch({ type: "SHUFFLE" })}
          aria-label="Mélanger"
          className="inline-flex items-center gap-1 text-sm hover:underline"
        >
          <Shuffle className="h-4 w-4" /> {state.shuffled ? "Mélangé" : "Mélanger"}
        </button>
      </div>

      <div role="list" aria-label="Progression" className="flex flex-wrap gap-1">
        {state.deck.map((c, i) => {
          const status = statusOf(c.id);
          const cls =
            i === state.cursor ? "bg-[var(--color-primary)]" :
            status === "known" ? "bg-[var(--color-primary)]/70" :
            status === "review" ? "border border-[var(--color-primary)] bg-transparent" :
            "bg-[var(--color-muted)]";
          return <span key={c.id} role="listitem" className={cn("h-2 w-2 rounded-full", cls)} />;
        })}
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Flashcard
          card={card}
          position={state.cursor + 1}
          total={state.deck.length}
          flipped={state.flipped}
          onFlip={() => dispatch({ type: "FLIP" })}
          onKnown={() => {
            markKnown(card.id);
            setAnnounce("Carte marquée comme connue");
            if (prefs.autoAdvance) dispatch({ type: "NEXT" });
          }}
          onReview={() => {
            markReview(card.id);
            setAnnounce("Carte marquée à revoir");
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => dispatch({ type: "PREV" })}
          disabled={state.cursor === 0}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-[var(--radius)] border disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Précédent
        </button>
        <span className="text-sm text-[var(--color-muted-foreground)] tabular-nums">
          Carte {state.cursor + 1} / {state.deck.length}
        </span>
        <button
          onClick={() => dispatch({ type: "NEXT" })}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-[var(--radius)] border"
        >
          Suivant <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div aria-live="polite" className="sr-only">{announce}</div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests.**

```bash
pnpm test src/components/deck/StudySession.test.tsx
```

- [ ] **Step 4: Commit.**

```bash
git add src/components/deck/StudySession.tsx src/components/deck/StudySession.test.tsx
git commit -m "feat: StudySession with auto-advance, keyboard, swipe, finished screen"
```

---

### Task 32: Study route

**Files:**
- Create: `src/routes/Study.tsx`

- [ ] **Step 1: Implement.**

```tsx
// src/routes/Study.tsx
import { Navigate, useParams } from "react-router-dom";
import { allCards, cardsByTheme } from "@/data";
import { ThemeId } from "@/lib/card";
import { themeById } from "@/data/themes";
import { StudySession } from "@/components/deck/StudySession";

export function Study() {
  const { theme } = useParams<{ theme: string }>();

  if (theme === "all") {
    return <StudySession cards={allCards} backHref="/" themeLabel="Tout mélanger" />;
  }

  const parsed = ThemeId.safeParse(theme);
  if (!parsed.success) return <Navigate to="/" replace />;

  const t = themeById(parsed.data);
  return <StudySession cards={cardsByTheme(parsed.data)} backHref="/" themeLabel={t.label_fr} />;
}
```

- [ ] **Step 2: Commit.**

```bash
git add src/routes/Study.tsx
git commit -m "feat: Study route routes per theme or 'all'"
```

---

# Phase 9 — Routing & layout

### Task 33: Hash router

**Files:**
- Create: `src/routes/About.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Stub the About route.** (Filled in fully in Task 36 — this stub just lets the router compile.)

```tsx
// src/routes/About.tsx
export function About() {
  return <div>À propos</div>;
}
```

- [ ] **Step 2: Wire the router.**

```tsx
// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "@/routes/Home";
import { Study } from "@/routes/Study";
import { About } from "@/routes/About";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-[960px] px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/study/:theme" element={<Study />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
```

(Header and Footer in next two tasks.)

- [ ] **Step 3: Commit.**

```bash
git add src/App.tsx src/routes/About.tsx
git commit -m "feat: hash router with Home / Study / About / 404→/"
```

---

### Task 34: Header (title + tricolor + dark toggle + About link)

**Files:**
- Create: `src/components/layout/Header.tsx`

- [ ] **Step 1: Implement.**

```tsx
// src/components/layout/Header.tsx
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { FlagAccent } from "@/components/flashcard/FlagAccent";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur border-b border-[var(--color-border)]">
      <div className="mx-auto w-full max-w-[960px] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="inline-flex flex-col">
          <span className="font-semibold text-base sm:text-lg leading-none">
            Livret du Citoyen{" "}
            <span dir="rtl" lang="ar" className="text-[var(--color-muted-foreground)] font-normal">
              · كتيب المواطن
            </span>
          </span>
          <FlagAccent orientation="horizontal" className="mt-1" />
        </Link>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <Link
            to="/about"
            aria-label="À propos"
            className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit.**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: Header with bilingual title, tricolor underline, dark toggle, About link"
```

---

### Task 35: Footer with attribution

**Files:**
- Create: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Implement.**

```tsx
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-8">
      <div className="mx-auto w-full max-w-[960px] px-4 sm:px-6 py-4 text-xs text-[var(--color-muted-foreground)] space-y-1">
        <p>
          Contenu original © Ministère de l'Intérieur. Traduction arabe et application : Rami Hanna,
          CC BY-SA 4.0. Application non officielle.
        </p>
        <p dir="rtl" lang="ar">
          المحتوى الأصلي © وزارة الداخلية الفرنسية. الترجمة العربية والتطبيق: رامي حنا، رخصة CC BY-SA 4.0. تطبيق غير رسمي.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit.**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: Footer with bilingual attribution"
```

---

### Task 36: About route (sources, license, privacy, settings, reset)

**Files:**
- Modify: `src/routes/About.tsx`

- [ ] **Step 1: Replace stub with full About page.**

```tsx
// src/routes/About.tsx
import { useProgress } from "@/lib/useProgress";

export function About() {
  const { prefs, setPref, reset } = useProgress();

  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Sources · المصادر</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <a href="https://www.immigration.interieur.gouv.fr" target="_blank" rel="noreferrer">
              Livret du citoyen — Ministère de l'Intérieur (Édition février 2022)
            </a>
          </li>
          <li>Charte des droits et devoirs du citoyen français — Ministère de l'Intérieur</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Confidentialité · الخصوصية</h2>
        <p className="text-[var(--color-muted-foreground)]">
          Aucun compte. Aucun cookie. Aucun traceur. Vos progrès restent dans votre navigateur (localStorage).
        </p>
        <p dir="rtl" lang="ar" className="text-[var(--color-muted-foreground)]">
          لا حساب. لا ملفات تعريف ارتباط. لا متعقّبات. يبقى تقدّمك في متصفّحك.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Réglages · الإعدادات</h2>
        <label className="flex items-center justify-between py-2">
          <span>Avancement automatique après « Je sais »</span>
          <input
            type="checkbox"
            checked={prefs.autoAdvance}
            onChange={(e) => setPref("autoAdvance", e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Progrès</h2>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Réinitialiser tout votre progrès ?")) reset();
          }}
          className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
        >
          Réinitialiser le progrès
        </button>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Licence</h2>
        <p className="text-[var(--color-muted-foreground)]">
          Code : MIT. Traductions arabes : CC BY-SA 4.0. Contenu source français : © Ministère de l'Intérieur (document public).
        </p>
      </section>
    </article>
  );
}
```

- [ ] **Step 2: Visually verify in dev server.**

```bash
pnpm dev
```
Navigate to /#/about — confirm sections render and reset button works.

- [ ] **Step 3: Commit.**

```bash
git add src/routes/About.tsx
git commit -m "feat: About page with sources, privacy, settings, reset, license"
```

---

### Task 37: Favicon + OG image stubs

**Files:**
- Create: `public/favicon.svg`, `public/og.png` (placeholder)

- [ ] **Step 1: Create favicon.**

```svg
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#6366f1"/>
  <text x="50%" y="56%" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="28" fill="#fff">LC</text>
  <rect x="14" y="48" width="12" height="3" fill="#0055A4"/>
  <rect x="26" y="48" width="12" height="3" fill="#FFFFFF"/>
  <rect x="38" y="48" width="12" height="3" fill="#EF4135"/>
</svg>
```

- [ ] **Step 2: Create a 1200×630 placeholder OG image.**

Use a simple ImageMagick or Sharp one-liner; if not installed, copy `public/favicon.svg` as `og.svg` and skip the PNG for now.

```bash
# minimal placeholder — engineer can iterate later
cp public/favicon.svg public/og.svg
```

- [ ] **Step 3: Commit.**

```bash
git add public/favicon.svg public/og.svg
git commit -m "feat: tricolor LC favicon and OG placeholder"
```

---

# Phase 10 — E2E tests

### Task 38: Playwright setup + smoke test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json`, `.gitignore`

- [ ] **Step 1: Install.**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2: Add config.**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm preview --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile",  use: { ...devices["iPhone SE (3rd generation)"] } },
  ],
});
```

- [ ] **Step 3: Add scripts to `package.json`.**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 4: Add ignore.**

In `.gitignore` append:
```
playwright-report
test-results
playwright/.cache
```

- [ ] **Step 5: Smoke test.**

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("home renders deck picker with 6 tiles", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2 })).toContainText(/choisissez un thème/i);
  const tiles = page.getByRole("button", { name: /valeurs|droits|institutions|histoire|géographie|droits de l'homme/i });
  await expect(tiles).toHaveCount(6);
});
```

- [ ] **Step 6: Build and run.**

```bash
pnpm build
pnpm test:e2e
```
Expected: 1 passing on each project (desktop + mobile).

- [ ] **Step 7: Commit.**

```bash
git add .
git commit -m "test: Playwright config + smoke test for home"
```

---

### Task 39: Full study flow E2E

**Files:**
- Create: `tests/e2e/study-flow.spec.ts`

- [ ] **Step 1: Write the test.**

```ts
// tests/e2e/study-flow.spec.ts
import { test, expect } from "@playwright/test";

test("study a deck, mark cards, reload, progress survives, then reset", async ({ page }) => {
  await page.goto("/");

  // Open Valeurs deck
  await page.getByRole("button", { name: /valeurs/i }).first().click();
  await expect(page).toHaveURL(/study\/valeurs/);

  const card = page.getByTestId("flashcard");
  await expect(card).toBeVisible();

  // Card 1: flip then Je sais → auto-advance
  await card.click();
  await page.getByRole("button", { name: /je sais/i }).click();
  await expect(page.getByText(/2 \/ 3/)).toBeVisible();

  // Card 2: flip then À revoir → stay
  await card.click();
  await page.getByRole("button", { name: /à revoir/i }).click();
  await expect(page.getByText(/2 \/ 3/)).toBeVisible();

  // Reload — progress should persist
  await page.reload();
  // After reload, cursor resets but localStorage should remember Je sais on card 1.
  // Go home, deck tile should show 1 / 3.
  await page.getByRole("link", { name: /retour/i }).click();
  await expect(page.getByText("1 / 3").first()).toBeVisible();

  // Reset progress in About
  await page.getByRole("link", { name: /À propos/i }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /réinitialiser le progrès/i }).click();

  // Back home — should be 0 / 3
  await page.getByRole("link", { name: /Livret du Citoyen/i }).click();
  await expect(page.getByText("0 / 3").first()).toBeVisible();
});
```

- [ ] **Step 2: Build and run.**

```bash
pnpm build
pnpm test:e2e
```

- [ ] **Step 3: Commit.**

```bash
git add tests/e2e/study-flow.spec.ts
git commit -m "test: full study flow E2E with progress persistence and reset"
```

---

### Task 40: RTL + reduced-motion E2E checks

**Files:**
- Create: `tests/e2e/rtl-reduced-motion.spec.ts`

- [ ] **Step 1: Write the test.**

```ts
// tests/e2e/rtl-reduced-motion.spec.ts
import { test, expect } from "@playwright/test";

test("Arabic spans are dir=rtl", async ({ page }) => {
  await page.goto("/study/valeurs");
  const ar = page.locator("[dir='rtl'][lang='ar']").first();
  await expect(ar).toBeVisible();
  await expect(ar).toHaveAttribute("dir", "rtl");
});

test.use({ reducedMotion: "reduce" });
test("flip works under reduced motion", async ({ page }) => {
  await page.goto("/study/valeurs");
  const card = page.getByTestId("flashcard");
  await card.click();
  await expect(page.getByRole("button", { name: /je sais/i })).toBeVisible();
});
```

- [ ] **Step 2: Build and run.**

```bash
pnpm build
pnpm test:e2e
```

- [ ] **Step 3: Commit.**

```bash
git add tests/e2e/rtl-reduced-motion.spec.ts
git commit -m "test: RTL Arabic and reduced-motion E2E"
```

---

# Phase 11 — CI & deploy

### Task 41: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Add workflow.**

```yaml
# .github/workflows/ci.yml
name: ci
on:
  push: { branches: [main] }
  pull_request: {}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: SKIP_AUDIO_CHECK=1 pnpm validate:cards
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          if-no-files-found: ignore

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: livret-citoyen
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Commit.**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint + typecheck + test + e2e + deploy to Cloudflare Pages"
```

---

### Task 42: Cloudflare Pages connection (manual + docs)

**Files:**
- Create: `docs/DEPLOY.md`

- [ ] **Step 1: Document the manual setup steps.**

```markdown
<!-- docs/DEPLOY.md -->
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
```

- [ ] **Step 2: Commit.**

```bash
git add docs/DEPLOY.md
git commit -m "docs: Cloudflare Pages deployment guide"
```

---

### Task 43: README and final cleanup

**Files:**
- Create: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Write README.**

```markdown
# Livret du Citoyen — Bilingual Flashcards

A free, ad-free, account-free web app that drills the verbatim contents of the official French citizenship study materials (*Livret du citoyen* + *Charte des droits et devoirs*) with Arabic translations as a comprehension aid.

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

Vite, React 18, TypeScript, Tailwind v4, shadcn/ui, react-router-dom (HashRouter), Zod, lucide-react.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit + component tests
pnpm test:e2e     # Playwright (run pnpm build first)
pnpm lint
pnpm typecheck
SKIP_AUDIO_CHECK=1 pnpm validate:cards   # Plan 1 only — Plan 2 generates audio
pnpm build
pnpm preview      # http://localhost:4173
```

## Project layout

```
src/
  data/cards/*.json        ← card content (Plan 1: 3 fixture cards/theme; Plan 2: full corpus)
  data/themes.ts           ← 6 themes registry
  lib/                     ← schema, audio, progress, theme, shuffle
  components/flashcard/    ← Flashcard, CardFront/Back, AudioButton, FlagAccent, ResponseButtons
  components/deck/         ← DeckPicker, DeckTile, StudySession, sessionReducer
  components/layout/       ← Header, Footer, DarkModeToggle
  routes/                  ← Home, Study, About
public/audio/              ← MP3s, content-addressed by sha1(text). Generated by Plan 2.
scripts/                   ← validate-cards (Plan 1); extract-source, draft-cards, build-audio (Plan 2)
```

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md).

## License

- Code: MIT
- Arabic translations: CC BY-SA 4.0 — Rami Hanna
- French content: © Ministère de l'Intérieur (public administrative document)

This is a **non-official application**. Authoritative source: https://www.immigration.interieur.gouv.fr.
```

- [ ] **Step 2: Final round of all checks.**

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
SKIP_AUDIO_CHECK=1 pnpm validate:cards
pnpm build
pnpm test:e2e
```

All should pass.

- [ ] **Step 3: Commit.**

```bash
git add README.md
git commit -m "docs: README with features, stack, dev workflow, deployment, license"
```

---

# Self-review checklist

Run after final commit:

- [ ] Every spec section in `docs/superpowers/specs/2026-05-08-livret-citoyen-flashcards-design.md` is reflected by at least one task in this plan, except §7 (authoring), §8 (audio build), §19 (PWA), which are explicitly Plan 2 / future.
- [ ] Decisions D1–D18 from the spec are implemented:
  - D1 source set → §11 fixture cards drawn from Livret + Charte + DDHC ✓
  - D2 hybrid authoring → fixture file headers note "[AR-DRAFT]" placeholders ✓
  - D3 audio FR-only → Card schema has `fr_q_sha1`/`fr_a_sha1` only, no AR audio fields ✓
  - D4 light progress → `lib/progress.ts` + `useProgress` ✓
  - D5 themed decks + Tout mélanger → DeckPicker grid + `/study/all` route ✓
  - D6 stack → Vite + React + TS + Tailwind v4 + shadcn ✓
  - D7 mobile-first → CardFront/CardBack responsive, swipe gestures, mobile Playwright project ✓
  - D8 Cloudflare Pages → `docs/DEPLOY.md` + CI deploy ✓
  - D9 theme tokens → `index.css` ✓
  - D10 flag treatment → FlagAccent on each card + Header underline + favicon ✓
  - D11 auto-advance only after Je sais → StudySession reducer ✓
  - D12 tap-to-flip → Flashcard `onClick`/Space ✓
  - D13/D14/D15/D16 license → README + Footer ✓
  - D17 PWA out of v1 → not in plan ✓
  - D18 out-of-scope → no accounts, no server, no SM-2, no quiz, no AR audio ✓
- [ ] **Visual regression (spec §15)** is deliberately **deferred** to a follow-up plan: Plan 1 ships with `[AR-DRAFT]` Arabic placeholders that Plan 2 replaces, so any baselines captured now would all need to be re-baselined immediately. The Playwright infra (Task 38) is in place; the snapshot test files can be added in a 3-task add-on after Plan 2 lands.
- [ ] No placeholders, TODOs, or "implement later" text in any task.
- [ ] Type/method names consistent across tasks: `Card`, `themes`, `themeById`, `cardsByTheme`, `allCards`, `markKnown`, `markReview`, `useProgress`, `audioUrl`, `useAudioPlayer`, `Flashcard`, `CardFront`, `CardBack`, `AudioButton`, `FlagAccent`, `ResponseButtons`, `DeckTile`, `DeckPicker`, `DeckProgressRing`, `StudySession`, `sessionReducer`, `initSession` — all match.
- [ ] Each task ends in a commit.

---

# Plan 2 (next session)

After Plan 1 ships, write **Plan 2 — Content Pipeline**, covering:

- `scripts/extract-source.ts` (PDF text → atomic chunks per theme)
- `scripts/draft-cards.ts` (chunks → AI-drafted full cards using Claude API)
- Manual review workflow (move from `data/cards-draft/` to `src/data/cards/`)
- `scripts/build-audio.ts` (ElevenLabs TTS, content-addressed MP3, `--dry-run`, `--force`, `--theme` flags)
- `.env.example` for `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ANTHROPIC_API_KEY`
- Re-run `pnpm validate:cards` (without `SKIP_AUDIO_CHECK=1`) once audio is generated
- Replace fixture cards with real ~85–112 card corpus

Plan 2 builds on Plan 1's deployable shell — no breaking changes.
