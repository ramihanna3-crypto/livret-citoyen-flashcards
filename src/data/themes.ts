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

export type Theme = {
  id: ThemeId;
  label_fr: string;
  label_ar: string;
  description_fr: string;
  description_ar: string;
  icon: LucideIcon;
  accentClass: string;
};

export const themes: Theme[] = [
  {
    id: "valeurs",
    label_fr: "Valeurs & principes",
    label_ar: "القيم والمبادئ",
    description_fr: "Liberté, égalité, fraternité, laïcité.",
    description_ar: "الحرية، المساواة، الإخاء، العلمانية.",
    icon: Scale,
    accentClass: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    id: "droits-devoirs",
    label_fr: "Droits & devoirs",
    label_ar: "الحقوق والواجبات",
    description_fr: "Ce que le citoyen doit faire et ne doit pas faire.",
    description_ar: "ما يجب على المواطن فعله وما لا يجب فعله.",
    icon: ShieldCheck,
    accentClass: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    id: "institutions",
    label_fr: "Institutions politiques",
    label_ar: "المؤسسات السياسية",
    description_fr: "Président, Parlement, justice, collectivités.",
    description_ar: "الرئيس، البرلمان، العدالة، الجماعات المحلية.",
    icon: Building2,
    accentClass: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "histoire",
    label_fr: "Histoire de France",
    label_ar: "تاريخ فرنسا",
    description_fr: "Préhistoire au XXᵉ siècle.",
    description_ar: "من عصور ما قبل التاريخ إلى القرن العشرين.",
    icon: Landmark,
    accentClass: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
  },
  {
    id: "geographie",
    label_fr: "Géographie & place de la France",
    label_ar: "الجغرافيا ومكانة فرنسا",
    description_fr: "Régions, fleuves, Europe, économie.",
    description_ar: "المناطق، الأنهار، أوروبا، الاقتصاد.",
    icon: Map,
    accentClass: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    id: "ddhc",
    label_fr: "Droits de l'Homme 1789",
    label_ar: "إعلان حقوق الإنسان 1789",
    description_fr: "Les 17 articles fondateurs.",
    description_ar: "المواد السبعة عشر التأسيسية.",
    icon: ScrollText,
    accentClass: "bg-rose-50 dark:bg-rose-950/30",
  },
];

export function themeById(id: ThemeId): Theme {
  const t = themes.find((t) => t.id === id);
  if (!t) throw new Error(`Unknown theme: ${id}`);
  return t;
}
