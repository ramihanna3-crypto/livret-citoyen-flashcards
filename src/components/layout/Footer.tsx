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
        <p dir={lang.dir} lang={lang.lang}>
          {ui.footer_attribution}
        </p>
      </div>
    </footer>
  );
}
