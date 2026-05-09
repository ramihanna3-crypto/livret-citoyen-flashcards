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
