import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RatingPrompt } from "@/components/rating/RatingPrompt";

/**
 * Routes are loaded on-demand via React.lazy so the initial bundle only
 * carries the shell (Header / Footer / RatingPrompt) and whichever single
 * route the user lands on.
 *
 * The .then() callback adapts each route's NAMED export (e.g. `Home`) into
 * the default-export shape React.lazy expects. This avoids touching the
 * source files — they keep their `export function Home()` so tests and
 * direct imports elsewhere continue to work.
 *
 * Biggest win: the Study route carries all the card data
 * (cardsByTheme → src/data/cards/**), the flashcard tree, audio hooks, and
 * the session reducer. A first-time visitor landing on Home now downloads
 * only what Home needs; Study + its data fetches lazily on navigation.
 */
const Home = lazy(() => import("@/routes/Home").then((m) => ({ default: m.Home })));
const Study = lazy(() => import("@/routes/Study").then((m) => ({ default: m.Study })));
const About = lazy(() => import("@/routes/About").then((m) => ({ default: m.About })));

/**
 * Tiny placeholder shown while a route chunk is in flight. Kept deliberately
 * minimal — on a decent connection the chunk loads in <100ms and a heavy
 * spinner would feel like jank.
 */
function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center min-h-[40vh]"
    >
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-[960px] px-4 sm:px-6 py-6">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/study/:theme" element={<Study />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        {/*
          Rating prompt mounted at the App level so it can appear over any
          route. The component is invisible (returns null) until the user
          crosses the 25-card threshold; trigger logic lives in
          src/lib/rating.ts and is fed by StudySession on each card flip.
        */}
        <RatingPrompt />
      </div>
    </HashRouter>
  );
}
