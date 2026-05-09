import { z } from "zod";

export const ThemeId = z.enum([
  "valeurs",
  "droits-devoirs",
  "institutions",
  "histoire",
  "geographie",
  "ddhc",
]);
export type ThemeId = z.infer<typeof ThemeId>;

export const LanguageId = z.enum(["ar", "uk", "fa", "ps", "ht", "tr"]);
export type LanguageId = z.infer<typeof LanguageId>;

const sha1 = z.string().regex(/^[a-f0-9]{40}$/, "must be a 40-char hex sha1");

const Translation = z.object({
  q: z.string().min(3).max(400),
  a: z.string().min(3).max(2000),
});
export type Translation = z.infer<typeof Translation>;

// Translations: Arabic is required (canonical, original); other languages optional
// so that languages can be added incrementally without breaking existing cards.
const Translations = z.object({
  ar: Translation,
  uk: Translation.optional(),
  fa: Translation.optional(),
  ps: Translation.optional(),
  ht: Translation.optional(),
  tr: Translation.optional(),
});
export type Translations = z.infer<typeof Translations>;

export const Card = z.object({
  id: z.string().regex(/^[a-z-]+-\d{3}$/, "id must be like theme-NNN"),
  theme: ThemeId,
  fr_q: z.string().min(3).max(400),
  fr_a: z.string().min(3).max(2000),
  source: z.string().min(3),
  translations: Translations,
  audio: z.object({
    fr_q_sha1: sha1,
    fr_a_sha1: sha1,
  }),
});

export type Card = z.infer<typeof Card>;
export const CardArray = z.array(Card);
