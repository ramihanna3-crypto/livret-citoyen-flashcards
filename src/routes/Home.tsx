import { DeckPicker } from "@/components/deck/DeckPicker";
import { UsageCount } from "@/components/layout/UsageCount";
import { ShareButtons } from "@/components/share/ShareButtons";
import { useProgress } from "@/lib/useProgress";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";

export function Home() {
  const { prefs } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);
  // Home uses the canonical SEO title baked into index.html — the title
  // Google sees when crawling the static shell.
  useDocumentTitle();

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">
        Choisissez un thème ·{" "}
        <span dir={lang.dir} lang={lang.lang}>
          {ui.pick_theme}
        </span>
      </h2>
      <DeckPicker />
      {/* Share row sits between the deck picker and the visit counter so
          it gets a prominent middle slot — every visit sees it, and it's
          one of the first things the eye lands on after the decks. */}
      <ShareButtons variant="home" />
      <UsageCount />
    </section>
  );
}
