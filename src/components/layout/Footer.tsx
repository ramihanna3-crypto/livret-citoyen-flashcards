import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";

export function Footer() {
  const { prefs } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);

  return (
    <footer className="border-t border-[var(--color-border)] mt-8">
      <div className="mx-auto w-full max-w-[960px] px-4 sm:px-6 py-4 text-xs text-[var(--color-muted-foreground)] space-y-1">
        <p>
          Contenu original © Ministère de l'Intérieur. Traduction et application : Rami Hanna, CC
          BY-SA 4.0. Application non officielle.
        </p>
        {/*
          Per user feedback: the footer attribution should be left-anchored
          for every language. RTL scripts (Arabic, Persian, Dari, Pashto)
          still read right-to-left at the character level (we keep `dir`),
          but the line itself sits flush against the left edge — `text-left`
          overrides the default `text-align: start` so right-alignment
          doesn't kick in for RTL. This rule is scoped to the footer only;
          card content keeps its natural per-language alignment.
        */}
        <p dir={lang.dir} lang={lang.lang} className="text-left">
          {ui.footer_attribution}
        </p>
      </div>
    </footer>
  );
}
