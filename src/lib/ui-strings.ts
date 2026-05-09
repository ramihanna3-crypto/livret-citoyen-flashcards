import type { LanguageId, ThemeId } from "@/lib/card";
import raw from "@/data/ui-strings.json";

export type UiStrings = {
  pick_theme: string;
  shuffle_all: string;
  finished: string;
  sources: string;
  privacy: string;
  privacy_text: string;
  settings: string;
  footer_attribution: string;
};

export type ThemeI18n = { label: string; description: string };

type Bundle = { ui: UiStrings; themes: Record<ThemeId, ThemeI18n> };
const all = raw as Record<LanguageId, Bundle>;

export function uiStrings(lang: LanguageId): UiStrings {
  return all[lang]?.ui ?? all.ar.ui;
}

export function themeI18n(lang: LanguageId, themeId: ThemeId): ThemeI18n {
  return all[lang]?.themes[themeId] ?? all.ar.themes[themeId];
}
