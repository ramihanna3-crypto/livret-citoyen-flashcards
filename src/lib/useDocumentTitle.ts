import { useEffect } from "react";

/**
 * Sets the browser tab title to "{label} · Livret du Citoyen" while a
 * component is mounted, and restores the previous title on unmount.
 *
 * Pass no argument (or `undefined`) on the Home route to use the canonical
 * SEO title baked into index.html — that's the title Google indexes, since
 * the app uses HashRouter and Google sees only the static HTML for every
 * URL. Per-route titles set here only affect the browser's tab text, not
 * search visibility.
 *
 * Example:
 *   useDocumentTitle();                       // Home — restores index.html title
 *   useDocumentTitle("À propos");             // "À propos · Livret du Citoyen"
 *   useDocumentTitle(themeLabel);             // e.g. "Histoire de France · …"
 */

const BRAND = "Livret du Citoyen";
const DEFAULT_HOME_TITLE = `Préparer l'entretien d'assimilation · ${BRAND}`;

export function useDocumentTitle(label?: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = label ? `${label} · ${BRAND}` : DEFAULT_HOME_TITLE;
    return () => {
      document.title = previous;
    };
  }, [label]);
}
