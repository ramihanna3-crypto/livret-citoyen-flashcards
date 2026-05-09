import { Navigate, useParams } from "react-router-dom";
import { allCards, cardsByTheme } from "@/data";
import { ThemeId } from "@/lib/card";
import { themeById } from "@/data/themes";
import { StudySession } from "@/components/deck/StudySession";

export function Study() {
  const { theme } = useParams<{ theme: string }>();

  if (theme === "all") {
    return <StudySession cards={allCards} backHref="/" themeLabel="Tout mélanger" />;
  }

  const parsed = ThemeId.safeParse(theme);
  if (!parsed.success) return <Navigate to="/" replace />;

  const t = themeById(parsed.data);
  return <StudySession cards={cardsByTheme(parsed.data)} backHref="/" themeLabel={t.label_fr} />;
}
