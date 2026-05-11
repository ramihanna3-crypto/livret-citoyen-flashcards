import { DeckPicker } from "@/components/deck/DeckPicker";
import { UsageCount } from "@/components/layout/UsageCount";
import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";

export function Home() {
  const { prefs } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">
        Choisissez un thème ·{" "}
        <span dir={lang.dir} lang={lang.lang}>
          {ui.pick_theme}
        </span>
      </h2>
      <DeckPicker />
      <UsageCount />
    </section>
  );
}
