import { useNavigate } from "react-router-dom";
import { themes } from "@/data/themes";
import { DeckTile } from "@/components/deck/DeckTile";
import { cardsByTheme } from "@/data";
import { useProgress } from "@/lib/useProgress";
import { languageById } from "@/lib/languages";
import { uiStrings } from "@/lib/ui-strings";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeckPicker() {
  const navigate = useNavigate();
  const { knownCount, prefs } = useProgress();
  const lang = languageById(prefs.language);
  const ui = uiStrings(prefs.language);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {themes.map((t) => {
          const total = cardsByTheme(t.id).length;
          return (
            <DeckTile
              key={t.id}
              theme={t}
              known={knownCount(t.id)}
              total={total}
              onClick={() => navigate(`/study/${t.id}`)}
            />
          );
        })}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => navigate("/study/all")}
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius)] px-5 py-3",
            // Solid deep indigo. Stays inside the single color family the
            // whole app already uses for primary emphasis (--primary is
            // indigo-500 in light mode, indigo-400 in dark — both felt too
            // light against slate-900). Going to indigo-700 keeps the
            // button in-family but gives it the substance it needed
            // without introducing any second color, which would have read
            // as fluorescent against the restrained pastel-indigo palette
            // of the surrounding category tiles.
            "bg-indigo-700 hover:bg-indigo-800",
            "text-white font-medium",
            "transition-colors shadow-md shadow-black/20 dark:shadow-black/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
          )}
        >
          <Shuffle className="h-4 w-4" aria-hidden="true" />
          Tout mélanger ·{" "}
          <span dir={lang.dir} lang={lang.lang}>
            {ui.shuffle_all}
          </span>
        </button>
      </div>
    </div>
  );
}
