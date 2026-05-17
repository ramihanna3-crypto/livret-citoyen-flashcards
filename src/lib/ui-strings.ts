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
  /** "{count} people have used this app" — `{count}` is replaced at runtime. */
  usage_count: string;
  /** Section label on Home page: "Share this site". */
  share_prompt: string;
  /** Longer prompt shown on the deck-finish screen. */
  share_finish_prompt: string;
  /** Pre-composed message body that gets injected into WhatsApp / Telegram /
   * Email / SMS / clipboard. Ends with the site URL.
   */
  share_message: string;
  /** Brief confirmation toast shown after Copy. */
  share_link_copied: string;
  /** Rating modal title: "Do you like Livret du Citoyen?" */
  rate_title: string;
  /** Rating modal subtitle: short reason text below the title. */
  rate_subtitle: string;
  /** Submit button label inside the rating modal. */
  rate_submit: string;
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
