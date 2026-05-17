import { useEffect, useRef, useState } from "react";
import { Star, X } from "lucide-react";
import {
  dismissRatingPrompt,
  submitRating,
  useRatingState,
} from "@/lib/rating";
import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";

/**
 * One-shot rating modal that appears after the user has flipped 25 unique
 * cards (RATING_THRESHOLD in rating.ts) and has neither rated nor dismissed
 * previously. Mounted at the App level so it can appear over any route.
 *
 * - Star widget: 1–5 stars, hover preview, click to lock in a selection,
 *   "Envoyer" button to submit. Submit disabled until a star is chosen.
 * - Dismiss via the × in the top-right.
 * - Backdrop click and Esc key both dismiss (matches platform conventions
 *   for non-blocking dialogs — the modal is a courtesy ask, not a gate).
 * - Bilingual: French canonical, then the user's selected language with
 *   proper dir+lang attributes, matching the pattern used elsewhere.
 * - Focus is moved to the dialog on open; restored to the previously
 *   focused element on close.
 */
export function RatingPrompt() {
  const { shouldShow } = useRatingState();
  const { prefs } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);

  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Focus management: when the modal opens, remember what was focused and
  // move focus into the dialog. On close, return focus.
  useEffect(() => {
    if (!shouldShow) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dismissRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [shouldShow]);

  // Esc key dismisses.
  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismissRatingPrompt();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shouldShow]);

  if (!shouldShow) return null;

  function onSubmit() {
    if (selected < 1) return;
    submitRating(selected);
  }

  function onBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    // Only dismiss if the click was on the backdrop itself, not bubbling
    // up from inside the dialog.
    if (e.target === e.currentTarget) {
      dismissRatingPrompt();
    }
  }

  const activeStars = hovered || selected;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-title"
      onClick={onBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full max-w-md rounded-[var(--radius)] p-6",
          "bg-[var(--color-card)] text-[var(--color-card-foreground)]",
          "shadow-2xl border border-[var(--color-border)]",
        )}
      >
        {/* Dismiss button */}
        <button
          ref={dismissRef}
          type="button"
          onClick={dismissRatingPrompt}
          aria-label="Fermer"
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-md",
            "text-[var(--color-muted-foreground)]",
            "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
          )}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Bilingual title */}
        <h2
          id="rating-title"
          className="text-lg font-semibold text-center pr-6"
        >
          Aimez-vous Livret du Citoyen ?
        </h2>
        <p
          dir={lang.dir}
          lang={lang.lang}
          className="text-sm text-center mt-1 text-[var(--color-muted-foreground)]"
        >
          {ui.rate_title}
        </p>

        {/* Bilingual subtitle */}
        <p className="text-sm text-center mt-4">
          Votre avis nous aide à améliorer l&apos;application.
        </p>
        <p
          dir={lang.dir}
          lang={lang.lang}
          className="text-sm text-center mt-1 text-[var(--color-muted-foreground)]"
        >
          {ui.rate_subtitle}
        </p>

        {/* Star row */}
        <div
          className="flex justify-center gap-2 mt-6"
          role="radiogroup"
          aria-label="Note"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const isActive = n <= activeStars;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected === n}
                aria-label={`${n} ${n === 1 ? "étoile" : "étoiles"}`}
                onMouseEnter={() => setHovered(n)}
                onFocus={() => setHovered(n)}
                onBlur={() => setHovered(0)}
                onClick={() => setSelected(n)}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                )}
              >
                <Star
                  className={cn(
                    "h-9 w-9 transition-colors",
                    isActive
                      ? "text-amber-400 fill-amber-400"
                      : "text-[var(--color-muted-foreground)] fill-transparent",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={selected < 1}
            onClick={onSubmit}
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius)] px-5 py-2.5",
              "bg-indigo-700 hover:bg-indigo-800 text-white font-medium",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-700",
              "transition-colors shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
            )}
          >
            Envoyer
            <span dir={lang.dir} lang={lang.lang}>
              · {ui.rate_submit}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
