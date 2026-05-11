import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";
import { useVisitCount } from "@/lib/useVisitCount";

/**
 * Subtle line displaying the global visit count, e.g.
 *   "Utilisé par 12 345 personnes · {native version with same number}"
 *
 * Renders nothing until the count loads (or if the API is unreachable, e.g.
 * during local dev). Click target: none — purely informational.
 */
export function UsageCount() {
  const count = useVisitCount();
  const { prefs } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);

  if (count == null) return null;

  const formatted = new Intl.NumberFormat("fr-FR").format(count);
  const nativeFormatted = new Intl.NumberFormat(lang.lang, {
    useGrouping: true,
  }).format(count);
  const nativeText = ui.usage_count.replace("{count}", nativeFormatted);

  return (
    <p className="text-center text-xs text-[var(--color-muted-foreground)] pt-4">
      Utilisé par <strong className="font-semibold">{formatted}</strong> personnes ·{" "}
      <span dir={lang.dir} lang={lang.lang}>
        {nativeText}
      </span>
    </p>
  );
}
