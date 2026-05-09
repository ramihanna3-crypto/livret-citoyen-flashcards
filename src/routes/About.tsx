import { useProgress } from "@/lib/useProgress";

export function About() {
  const { prefs, setPref, reset } = useProgress();

  return (
    <article className="prose prose-sm max-w-none space-y-6">
      <section>
        <h2 className="text-xl font-semibold">Sources · المصادر</h2>
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
        <h2 className="text-xl font-semibold">Confidentialité · الخصوصية</h2>
        <p className="text-[var(--color-muted-foreground)]">
          Aucun compte. Aucun cookie. Aucun traceur. Vos progrès restent dans votre navigateur (localStorage).
        </p>
        <p dir="rtl" lang="ar" className="text-[var(--color-muted-foreground)]">
          لا حساب. لا ملفات تعريف ارتباط. لا متعقّبات. يبقى تقدّمك في متصفّحك.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Réglages · الإعدادات</h2>
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
          Code : MIT. Traductions arabes : CC BY-SA 4.0. Contenu source français : © Ministère de l'Intérieur (document public).
        </p>
      </section>
    </article>
  );
}
