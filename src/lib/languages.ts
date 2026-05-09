import type { LanguageId } from "@/lib/card";

export type LanguageInfo = {
  id: LanguageId;
  /** The native-script name of the language (e.g. "العربية", "Українська"). */
  label_native: string;
  /** The French name shown to French-first users (e.g. "Arabe", "Ukrainien"). */
  label_fr: string;
  /** Text direction for this language. */
  dir: "ltr" | "rtl";
  /** BCP 47 lang attribute for the rendered text. */
  lang: string;
  /** App title in the native language, shown beside "Livret du Citoyen" in the header. */
  app_title: string;
  /** Localized hint shown on card front: "Tap to reveal answer". */
  reveal_hint: string;
  /** Localized "I know" button label. */
  btn_known: string;
  /** Localized "Need to review" button label. */
  btn_review: string;
};

export const languages: LanguageInfo[] = [
  {
    id: "ar",
    label_native: "العربية",
    label_fr: "Arabe",
    dir: "rtl",
    lang: "ar",
    app_title: "كتيب المواطن",
    reveal_hint: "اضغط لكشف الإجابة",
    btn_known: "أعرف",
    btn_review: "أحتاج مراجعة",
  },
  {
    id: "uk",
    label_native: "Українська",
    label_fr: "Ukrainien",
    dir: "ltr",
    lang: "uk",
    app_title: "Зошит громадянина",
    reveal_hint: "Натисніть, щоб побачити відповідь",
    btn_known: "Я знаю",
    btn_review: "Потрібно повторити",
  },
  {
    id: "fa",
    label_native: "دری",
    label_fr: "Dari",
    dir: "rtl",
    lang: "fa-AF",
    app_title: "کتابچهٔ شهروند",
    reveal_hint: "برای دیدن پاسخ ضربه بزنید",
    btn_known: "می‌دانم",
    btn_review: "نیاز به مرور",
  },
  {
    id: "ps",
    label_native: "پښتو",
    label_fr: "Pachto",
    dir: "rtl",
    lang: "ps",
    app_title: "د اتباع کتابچه",
    reveal_hint: "د ځواب لیدلو لپاره ټک وکړئ",
    btn_known: "پوهیږم",
    btn_review: "بیا کتنې ته اړتیا",
  },
  {
    id: "ht",
    label_native: "Kreyòl Ayisyen",
    label_fr: "Créole haïtien",
    dir: "ltr",
    lang: "ht",
    app_title: "Liv Sitwayen an",
    reveal_hint: "Peze pou wè repons lan",
    btn_known: "Mwen konnen",
    btn_review: "Bezwen revize",
  },
  {
    id: "tr",
    label_native: "Türkçe",
    label_fr: "Turc",
    dir: "ltr",
    lang: "tr",
    app_title: "Vatandaş El Kitabı",
    reveal_hint: "Cevabı görmek için dokunun",
    btn_known: "Biliyorum",
    btn_review: "Tekrar gözden geçir",
  },
];

export function languageById(id: LanguageId): LanguageInfo {
  const l = languages.find((x) => x.id === id);
  if (!l) throw new Error(`Unknown language: ${id}`);
  return l;
}
