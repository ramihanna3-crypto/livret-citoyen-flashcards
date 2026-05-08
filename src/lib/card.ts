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

const sha1 = z.string().regex(/^[a-f0-9]{40}$/, "must be a 40-char hex sha1");

export const Card = z.object({
  id: z.string().regex(/^[a-z-]+-\d{3}$/, "id must be like theme-NNN"),
  theme: ThemeId,
  fr_q: z.string().min(3).max(400),
  ar_q: z.string().min(3).max(400),
  fr_a: z.string().min(3).max(2000),
  ar_a: z.string().min(3).max(2000),
  source: z.string().min(3),
  audio: z.object({
    fr_q_sha1: sha1,
    fr_a_sha1: sha1,
  }),
});

export type Card = z.infer<typeof Card>;
export const CardArray = z.array(Card);
