import { useProgress } from "@/lib/useProgress";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";

export function About() {
  const { prefs, setPref, reset } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);
  useDocumentTitle("À propos");

  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <section>
        <h2 className="text-xl font-semibold">
          Sources ·{" "}
          <span dir={lang.dir} lang={lang.lang}>
            {ui.sources}
          </span>
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <a href="https://www.immigration.interieur.gouv.fr" target="_blank" rel="noreferrer">
              Livret du citoyen — Ministère de l'Intérieur (Édition février 2022)
            </a>
          </li>
          <li>Charte des droits et devoirs du citoyen français — Ministère de l'Intérieur</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Confidentialité ·{" "}
          <span dir={lang.dir} lang={lang.lang}>
            {ui.privacy}
          </span>
        </h2>
        <p className="text-[var(--color-muted-foreground)]">
          Aucun compte. Aucun cookie. Aucun traceur. Vos progrès restent dans votre navigateur
          (localStorage).
        </p>
        <p dir={lang.dir} lang={lang.lang} className="text-[var(--color-muted-foreground)]">
          {ui.privacy_text}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          Réglages ·{" "}
          <span dir={lang.dir} lang={lang.lang}>
            {ui.settings}
          </span>
        </h2>
        <label className="flex items-center justify-between py-2">
          <span>Avancement automatique après « Je sais »</span>
          <input
            type="checkbox"
            checked={prefs.autoAdvance}
            onChange={(e) => setPref("autoAdvance", e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Progrès</h2>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Réinitialiser tout votre progrès ?")) reset();
          }}
          className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
        >
          Réinitialiser le progrès
        </button>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Licence</h2>
        <p className="text-[var(--color-muted-foreground)]">
          Code : MIT. Traductions : CC BY-SA 4.0. Contenu source français : © Ministère de
          l'Intérieur (document public, Licence Ouverte 2.0 d'Etalab).
        </p>
      </section>
    </article>
  );
}
