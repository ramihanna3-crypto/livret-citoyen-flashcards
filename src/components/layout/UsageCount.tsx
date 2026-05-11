import { Marquee } from "@/components/ui/marquee";
import { languages, languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";
import { useVisitCount } from "@/lib/useVisitCount";
import { cn } from "@/lib/utils";

/**
 * Horizontally-scrolling marquee that announces the global visit count.
 *
 * The surrounding text is rendered in the theme-adaptive foreground color
 * (near-black on light backgrounds, white on dark) so the marquee reads as
 * one coherent line across all 7 languages. The number itself stays in the
 * app's primary indigo and is wrapped in a small pill (background tint +
 * padding) so the digits have breathing room from the surrounding words.
 *
 * Large counts are abbreviated via locale-aware compact notation
 * (e.g. 37,520 → "38 k" in French, "38K" in English, "٣٨ ألف" in Arabic),
 * so the pill stays narrow no matter how the counter grows.
 */

export function UsageCount() {
  const count = useVisitCount();
  if (count == null) return null;

  function formatFor(localeTag: string): string {
    // Compact notation: 1 → "1", 999 → "999", 1_500 → "1.5K", 37_520 → "38K".
    // Each locale renders its own suffix ("k", "тис.", "ألف", "B"…). One
    // fractional digit so 1.2K reads naturally without becoming verbose.
    return new Intl.NumberFormat(localeTag, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(count!);
  }

  const slides = [
    // French canonical slide.
    {
      key: "fr",
      dir: "ltr" as const,
      lang: "fr",
      before: "Utilisé par",
      digits: formatFor("fr-FR"),
      after: "personnes",
    },
    // One slide per supported language, splitting the template on {count}.
    ...languages.map((l) => {
      const tpl = uiStrings(l.id).usage_count;
      const digits = formatFor(l.lang);
      const [before, ...rest] = tpl.split("{count}");
      const after = rest.join("{count}");
      const info = languageById(l.id);
      return {
        key: l.id,
        dir: info.dir,
        lang: info.lang,
        before,
        digits,
        after,
      };
    }),
  ];

  return (
    <div className="pt-6">
      <Marquee duration={45} pauseOnHover fade fadeAmount={12} aria-label="Compteur de visites">
        {slides.map((s) => (
          <span
            key={s.key}
            dir={s.dir}
            lang={s.lang}
            className={cn(
              // ~10% smaller than the previous text-sm / sm:text-base scale:
              //   text-sm  (14px) × 0.9 ≈ 12.6px = 0.7875rem
              //   text-base (16px) × 0.9 ≈ 14.4px = 0.9rem
              "mx-6 sm:mx-10 text-[0.7875rem] sm:text-[0.9rem] font-medium whitespace-nowrap inline-flex items-center",
              "text-[var(--color-foreground)]",
            )}
          >
            {s.before.trim() && <span>{s.before.trim()}</span>}
            <strong
              className={cn(
                "inline-block mx-2 px-2.5 py-0.5 rounded-md",
                "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                "font-semibold tabular-nums",
              )}
            >
              {s.digits}
            </strong>
            {s.after.trim() && <span>{s.after.trim()}</span>}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
