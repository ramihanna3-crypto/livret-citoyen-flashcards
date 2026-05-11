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
            // Gradient that traces the same color sweep as the category
            // tiles above it (indigo → violet → purple → fuchsia → pink →
            // rose). Using three stops (indigo → purple → fuchsia) gives
            // the button enough warmth on the right edge to echo the
            // pink/rose tiles without being a literal six-stop rainbow.
            // Saturated 600 shades read as rich on both light and dark
            // backgrounds, which fixes the "too light" lavender feel the
            // primary token had in dark mode.
            "bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600",
            "text-white font-medium",
            "hover:from-indigo-700 hover:via-purple-700 hover:to-fuchsia-700",
            "transition-colors shadow-md shadow-indigo-500/20 dark:shadow-fuchsia-500/20",
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
