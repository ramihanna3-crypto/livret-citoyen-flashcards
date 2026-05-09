import type { ThemeId } from "@/lib/card";
import {
  Scale,
  ShieldCheck,
  Building2,
  Landmark,
  Map,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

/**
 * Theme metadata: French label/description (canonical, always shown), plus
 * presentation hints (icon, tile background tint).
 *
 * Per-language translations of the label and description live in
 * src/data/ui-strings.json and are read via `themeI18n(lang, themeId)`.
 */
export type Theme = {
  id: ThemeId;
  label_fr: string;
  description_fr: string;
  icon: LucideIcon;
  accentClass: string;
};

export const themes: Theme[] = [
  {
    id: "valeurs",
    label_fr: "Valeurs & principes",
    description_fr: "Liberté, égalité, fraternité, laïcité.",
    icon: Scale,
    accentClass: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    id: "droits-devoirs",
    label_fr: "Droits & devoirs",
    description_fr: "Ce que le citoyen doit faire et ne doit pas faire.",
    icon: ShieldCheck,
    accentClass: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    id: "institutions",
    label_fr: "Institutions politiques",
    description_fr: "Président, Parlement, justice, collectivités.",
    icon: Building2,
    accentClass: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "histoire",
    label_fr: "Histoire de France",
    description_fr: "Préhistoire au XXᵉ siècle.",
    icon: Landmark,
    accentClass: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
  },
  {
    id: "geographie",
    label_fr: "Géographie & place de la France",
    description_fr: "Régions, fleuves, Europe, économie.",
    icon: Map,
    accentClass: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    id: "ddhc",
    label_fr: "Droits de l'Homme 1789",
    description_fr: "Les 17 articles fondateurs.",
    icon: ScrollText,
    accentClass: "bg-rose-50 dark:bg-rose-950/30",
  },
];

export function themeById(id: ThemeId): Theme {
  const t = themes.find((t) => t.id === id);
  if (!t) throw new Error(`Unknown theme: ${id}`);
  return t;
}
