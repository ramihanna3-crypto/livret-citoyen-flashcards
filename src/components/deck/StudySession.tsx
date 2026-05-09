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
  const [toast, setToast] = useState<{ kind: "known" | "review"; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(kind: "known" | "review", text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, text });
    setAnnounce(text);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        dispatch({ type: "FLIP" });
      }
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

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
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
        <p dir="rtl" lang="ar" className="text-[var(--color-muted-foreground)]">
          أحسنت! لقد أنهيت جميع البطاقات.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => dispatch({ type: "RESTART" })}
            className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          >
            Recommencer
          </button>
          <Link to={backHref} className="px-4 py-2 rounded-[var(--radius)] border">
            Retour
          </Link>
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
            i === state.cursor
              ? "bg-[var(--color-primary)]"
              : status === "known"
                ? "bg-[var(--color-primary)]/70"
                : status === "review"
                  ? "border border-[var(--color-primary)] bg-transparent"
                  : "bg-[var(--color-muted)]";
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
            showToast("known", "✓ Carte marquée comme connue");
            if (prefs.autoAdvance) dispatch({ type: "NEXT" });
          }}
          onReview={() => {
            markReview(card.id);
            showToast("review", "✗ Carte ajoutée à revoir");
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
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-20",
            "px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-none",
            "transition-opacity duration-200",
            toast.kind === "known"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] border border-[var(--color-border)]",
          )}
          role="status"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
