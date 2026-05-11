import type { Theme } from "@/data/themes";
import { DeckProgressRing } from "@/components/deck/DeckProgressRing";
import { cn } from "@/lib/utils";
import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";
import { themeI18n } from "@/lib/ui-strings";
import { useTiltHover } from "@/lib/useTiltHover";

type Props = { theme: Theme; known: number; total: number; onClick: () => void };

export function DeckTile({ theme, known, total, onClick }: Props) {
  const Icon = theme.icon;
  const { prefs } = useProgress();
  const lang = languageById(prefs.language);
  const tr = themeI18n(prefs.language, theme.id);
  // Cursor-following tilt + lift on hover. No design changes — only the
  // `ref`, inline `style` (transform), and the two mouse handlers below
  // are added; every existing class is preserved exactly.
  // Destructured (rather than `tilt.ref`) to satisfy react-hooks/refs,
  // which flags property access on objects that contain refs.
  const {
    ref: tiltRef,
    style: tiltStyle,
    onMouseMove: onTiltMove,
    onMouseLeave: onTiltLeave,
  } = useTiltHover<HTMLButtonElement>();

  return (
    <button
      ref={tiltRef}
      style={tiltStyle}
      onMouseMove={onTiltMove}
      onMouseLeave={onTiltLeave}
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
          <p
            className="mt-1 text-sm text-[var(--color-muted-foreground)]"
            dir={lang.dir}
            lang={lang.lang}
          >
            {tr.label}
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
