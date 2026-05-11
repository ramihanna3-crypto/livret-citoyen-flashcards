import { Marquee } from "@/components/ui/marquee";
import { languages, languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";
import { useVisitCount } from "@/lib/useVisitCount";

/**
 * Horizontally-scrolling marquee that announces the global visit count.
 *
 * One slide per supported language plus a French canonical slide. The marquee
 * pauses on hover so users can read each line; fade-masks at the edges keep
 * the design quiet rather than shouty.
 *
 * Renders nothing while the count is loading or unreachable (so /pnpm dev/
 * without a Worker silently omits the row).
 */
export function UsageCount() {
  const count = useVisitCount();
  if (count == null) return null;

  // Format the count in the locale of each slide so digits look native.
  function formatFor(localeTag: string): string {
    return new Intl.NumberFormat(localeTag, { useGrouping: true }).format(count!);
  }

  const slides = [
    // French canonical slide
    <Pill key="fr" dir="ltr" lang="fr">
      Utilisé par <strong className="text-[var(--color-primary)]">{formatFor("fr-FR")}</strong>{" "}
      personnes
    </Pill>,
    // One slide per supported language, in the order defined in the registry
    ...languages.map((l) => {
      const tpl = uiStrings(l.id).usage_count;
      const text = tpl.replace("{count}", formatFor(l.lang));
      const info = languageById(l.id);
      // Highlight the digits inside the localized string by splitting on them.
      const numeric = formatFor(l.lang);
      const parts = text.split(numeric);
      return (
        <Pill key={l.id} dir={info.dir} lang={info.lang}>
          {parts[0]}
          <strong className="text-[var(--color-primary)]">{numeric}</strong>
          {parts.slice(1).join(numeric)}
        </Pill>
      );
    }),
  ];

  return (
    <div className="pt-6">
      <Marquee duration={45} pauseOnHover fade fadeAmount={12} aria-label="Compteur de visites">
        {slides}
      </Marquee>
    </div>
  );
}

function Pill({
  children,
  dir,
  lang,
}: {
  children: React.ReactNode;
  dir: "ltr" | "rtl";
  lang: string;
}) {
  return (
    <span
      className="mx-6 sm:mx-10 text-sm sm:text-base font-medium text-[var(--color-muted-foreground)] whitespace-nowrap inline-flex items-center"
      dir={dir}
      lang={lang}
    >
      {children}
    </span>
  );
}
