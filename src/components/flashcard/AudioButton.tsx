import { Play, Square, Loader2, AlertCircle } from "lucide-react";
import { audioUrl } from "@/lib/audio";
import { useAudioPlayer } from "@/lib/useAudioPlayer";
import { cn } from "@/lib/utils";

type Props = {
  sha1: string;
  label: string;
  size?: "sm" | "md";
};

export function AudioButton({ sha1, label, size = "md" }: Props) {
  const { state, toggle } = useAudioPlayer(audioUrl(sha1));
  const px = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  const Icon =
    state === "loading"
      ? Loader2
      : state === "playing"
        ? Square
        : state === "error"
          ? AlertCircle
          : Play;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void toggle();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") e.stopPropagation();
      }}
      aria-label={label}
      aria-pressed={state === "playing"}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        "shadow-sm hover:opacity-90 transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
        px,
      )}
    >
      <Icon className={cn("h-4 w-4", state === "loading" && "animate-spin")} aria-hidden="true" />
    </button>
  );
}
