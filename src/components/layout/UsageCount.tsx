import { Marquee } from "@/components/ui/marquee";
import { languages, languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";
import { useVisitCount } from "@/lib/useVisitCount";
import { cn } from "@/lib/utils";

/**
 * Horizontally-scrolling marquee that announces the global visit count.
 *
 * Each slide cycles through the bleu/blanc/rouge of the French flag for the
 * surrounding TEXT color; the number itself stays in the app's primary indigo
 * and is wrapped in a small pill (background tint + padding) so the digits
 * have breathing room from the surrounding words.
 */

// Slide text-color rotation: bleu → blanc → rouge.
// Tailwind dark: variants raise contrast on the dark theme — official flag
// blue (#0055A4) is too dark on a slate-900 background, so dark mode uses a
// lighter sky blue; "blanc" means foreground (auto-adapting via the theme).
const SLIDE_COLOR_CYCLE = [
  "text-[#0055A4] dark:text-sky-300", // bleu
  "text-[var(--color-foreground)]", // blanc (theme-adaptive)
  "text-[#EF4135] dark:text-red-400", // rouge
];

export function UsageCount() {
  const count = useVisitCount();
  if (count == null) return null;

  function formatFor(localeTag: string): string {
    return new Intl.NumberFormat(localeTag, { useGrouping: true }).format(count!);
  }

  const slides = [
    // French canonical slide
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
        {slides.map((s, i) => (
          <span
            key={s.key}
            dir={s.dir}
            lang={s.lang}
            className={cn(
              "mx-6 sm:mx-10 text-sm sm:text-base font-medium whitespace-nowrap inline-flex items-center",
              SLIDE_COLOR_CYCLE[i % SLIDE_COLOR_CYCLE.length],
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
