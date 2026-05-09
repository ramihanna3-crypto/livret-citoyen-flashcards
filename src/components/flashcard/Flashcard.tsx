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
