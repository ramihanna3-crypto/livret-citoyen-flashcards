import type { Card } from "@/lib/card";
import { themeById } from "@/data/themes";
import { AudioButton } from "@/components/flashcard/AudioButton";
import { ResponseButtons } from "@/components/flashcard/ResponseButtons";

type Props = {
  card: Card;
  position: number;
  total: number;
  onKnown: () => void;
  onReview: () => void;
};

export function CardBack({ card, position, total, onKnown, onReview }: Props) {
  const theme = themeById(card.theme);
  return (
    <div className="flex h-full flex-col p-6 sm:p-8 gap-4">
      <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">
        {theme.label_fr} · {position} / {total}
      </div>

      <p
        className="font-serif text-base sm:text-lg leading-relaxed text-[var(--color-card-foreground)]"
        dir="ltr"
        lang="fr"
      >
        {card.fr_a}
      </p>

      <div className="flex justify-end">
        <AudioButton sha1={card.audio.fr_a_sha1} label="Écouter la réponse en français" />
      </div>

      <hr className="border-[var(--color-border)]" />

      <p
        className="text-sm sm:text-base leading-relaxed text-[var(--color-muted-foreground)]"
        dir="rtl"
        lang="ar"
      >
        {card.ar_a}
      </p>

      <div className="mt-auto pt-2">
        <ResponseButtons onKnown={onKnown} onReview={onReview} />
      </div>
    </div>
  );
}
