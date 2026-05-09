import type { Card } from "@/lib/card";
import { themeById } from "@/data/themes";
import { AudioButton } from "@/components/flashcard/AudioButton";

type Props = { card: Card; position: number; total: number };

export function CardFront({ card, position, total }: Props) {
  const theme = themeById(card.theme);
  return (
    <div className="flex h-full flex-col p-6 sm:p-8 gap-4">
      <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">
        {theme.label_fr} · {position} / {total}
      </div>

      <p className="font-sans font-semibold text-xl sm:text-2xl leading-snug text-[var(--color-card-foreground)]" dir="ltr" lang="fr">
        {card.fr_q}
      </p>

      <div className="flex justify-end">
        <AudioButton sha1={card.audio.fr_q_sha1} label="Écouter la question en français" />
      </div>

      <hr className="border-[var(--color-border)]" />

      <p className="font-[family-name:var(--font-sans)] text-base sm:text-lg text-[var(--color-muted-foreground)] leading-relaxed" dir="rtl" lang="ar">
        {card.ar_q}
      </p>

      <div className="mt-auto pt-4 text-center text-xs text-[var(--color-muted-foreground)]">
        Tap to reveal · <span dir="rtl" lang="ar">اضغط لكشف الإجابة</span>
      </div>
    </div>
  );
}
