import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";

export function About() {
  const { prefs, setPref, reset } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);

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

      <section>
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

      <section>
        <h2 className="text-xl font-semibold">
          Lettre au Ministère de l'Intérieur ·{" "}
          <span dir={lang.dir} lang={lang.lang}>
            {ui.letter_heading}
          </span>
        </h2>
        <p className="text-[var(--color-muted-foreground)]">
          Dans un esprit de transparence, voici le texte de la lettre destinée à être adressée à la
          Direction générale des étrangers en France pour les informer de l'existence de cette
          application et de l'usage qui est fait des contenus du <em>Livret du citoyen</em> sous
          Licence Ouverte 2.0 d'Etalab.
        </p>
        <blockquote className="mt-3 border-l-4 border-[var(--color-primary)] bg-[var(--color-muted)]/40 px-4 py-3 rounded-r font-serif text-sm leading-relaxed space-y-3">
          <p>
            <em>Objet :</em> Information — Application web pédagogique fondée sur le{" "}
            <em>Livret du citoyen</em>
          </p>
          <p>Madame, Monsieur,</p>
          <p>
            Je me permets de vous informer, à titre de courtoisie, de l'existence d'une application
            web pédagogique libre et gratuite que j'ai développée pour aider les candidates et
            candidats à la naturalisation française : <em>Livret du Citoyen — Cartes mémoire</em>.
          </p>
          <p>
            L'application reproduit le contenu du <em>Livret du citoyen</em> (édition février 2022)
            et de la <em>Charte des droits et devoirs du citoyen français</em>, conformément à la
            Licence Ouverte 2.0 d'Etalab applicable à ces publications. Elle est entièrement
            gratuite, sans publicité, sans cookie, sans création de compte ni collecte de données.
            La source est explicitement créditée sur chaque page : «&nbsp;Contenu original ©
            Ministère de l'Intérieur — Application non officielle.&nbsp;»
          </p>
          <p>
            L'application propose les contenus du Livret en six langues — français, arabe,
            ukrainien, dari, pachto, créole haïtien et turc — accompagnées d'un enregistrement audio
            des questions et réponses en français, dans une démarche d'accessibilité pour les
            publics réfugiés et primo-arrivants.
          </p>
          <p>
            Je tenais à porter cette démarche à votre connaissance, dans un esprit de transparence,
            et reste à votre disposition pour toute remarque, suggestion ou demande d'ajustement.
          </p>
          <p>
            Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations respectueuses.
          </p>
          <p className="mt-2">Rami Hanna</p>
        </blockquote>
      </section>
    </article>
  );
}
