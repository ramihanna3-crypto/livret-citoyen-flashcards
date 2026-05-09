import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";

type Props = { onKnown: () => void; onReview: () => void };

export function ResponseButtons({ onKnown, onReview }: Props) {
  const { prefs } = useProgress();
  const lang = languageById(prefs.language);

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onKnown();
        }}
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
        <span dir={lang.dir} lang={lang.lang} className="text-sm opacity-90">
          {lang.btn_known}
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReview();
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-3 rounded-lg border",
          "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
          "border-[var(--color-border)] hover:bg-[var(--color-muted)] transition min-h-[56px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        )}
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <X className="h-4 w-4" aria-hidden="true" />À revoir
        </span>
        <span dir={lang.dir} lang={lang.lang} className="text-sm opacity-90">
          {lang.btn_review}
        </span>
      </button>
    </div>
  );
}
