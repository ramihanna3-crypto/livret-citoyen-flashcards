/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: {
    // Per-route lazy() loading in App.tsx produces route chunks (home,
    // study, about). On top of that, split the long-lived vendor code
    // out so a small content edit doesn't bust the cache for the entire
    // React runtime — better repeat-visit LCP and smaller diffs on
    // Cloudflare's edge.
    //
    // Function form (not object form): Vite ships with Rolldown now,
    // which types `manualChunks` as a function only — the legacy
    // object-of-package-arrays form Rollup accepted is rejected at
    // typecheck time.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            // Core framework — changes only on dependency upgrades, so
            // it caches for the longest.
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-router") ||
              id.includes("/scheduler/")
            ) {
              return "react";
            }
            // Icon library — sizable; tree-shaken but isolated so it
            // doesn't churn on every code change.
            if (id.includes("/lucide-react/")) return "icons";
            // Schema validation — small, but in its own chunk for the
            // same caching reason.
            if (id.includes("/zod/")) return "validation";
          }
          // Everything else lands in the default chunk Rolldown picks
          // for it (app chunk + per-route chunks via dynamic imports).
          return undefined;
        },
      },
    },
    // Raise the chunk-size warning threshold modestly since the route
    // chunks (especially Study, which carries the card data) will sit
    // around 250–350KB pre-gzip. Hard ceiling stays via the warning,
    // but stops the noisy "consider code-splitting" line on every build.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.ts"],
    css: true,
  },
});
