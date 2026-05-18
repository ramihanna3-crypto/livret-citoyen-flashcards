import { Navigate, useParams } from "react-router-dom";
import { allCards, cardsByTheme } from "@/data";
import { ThemeId } from "@/lib/card";
import { themeById } from "@/data/themes";
import { StudySession } from "@/components/deck/StudySession";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function Study() {
  const { theme } = useParams<{ theme: string }>();

  if (theme === "all") {
    // Tab title for the "shuffle everything" mode.
    return <StudyRoute label="Tout mélanger" cards={allCards} backHref="/" />;
  }

  const parsed = ThemeId.safeParse(theme);
  if (!parsed.success) return <Navigate to="/" replace />;

  const t = themeById(parsed.data);
  return <StudyRoute label={t.label_fr} cards={cardsByTheme(parsed.data)} backHref="/" />;
}

// Tiny wrapper so the title hook can call into the SAME render path
// regardless of which branch above produced it. Keeps the conditional
// logic above clean and the hook call unconditional in the wrapper.
function StudyRoute({
  label,
  cards,
  backHref,
}: {
  label: string;
  cards: typeof allCards;
  backHref: string;
}) {
  useDocumentTitle(label);
  return <StudySession cards={cards} backHref={backHref} themeLabel={label} />;
}
