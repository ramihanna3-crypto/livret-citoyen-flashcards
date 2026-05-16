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
          BY-SA 4.0. Application non gouvernementale.
        </p>
        {/*
          Per user feedback: the footer attribution should be left-anchored
          for every language. RTL scripts (Arabic, Persian, Dari, Pashto)
          still read right-to-left at the character level (we keep `dir`),
          but the line itself sits flush against the left edge.

          The app sets a global `[dir="rtl"] { text-align: right }` rule in
          index.css so every RTL element across the app right-aligns by
          default — that rule is correct for cards, headers, and buttons.
          We use an INLINE `textAlign: left` here (higher specificity than
          any stylesheet rule) to override it exclusively for the footer
          attribution, without touching the global behavior.
        */}
        <p dir={lang.dir} lang={lang.lang} style={{ textAlign: "left" }}>
          {ui.footer_attribution}
        </p>
      </div>
    </footer>
  );
}
