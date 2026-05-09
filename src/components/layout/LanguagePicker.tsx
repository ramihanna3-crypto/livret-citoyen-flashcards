import { Languages } from "lucide-react";
import { languages } from "@/lib/languages";
import { useProgress } from "@/lib/useProgress";
import type { LanguageId } from "@/lib/card";
import { cn } from "@/lib/utils";

export function LanguagePicker() {
  const { prefs, setPref } = useProgress();

  return (
    <label
      className={cn(
        "relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md",
        "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        "hover:bg-[var(--color-muted)] transition cursor-pointer",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-ring)] focus-within:ring-offset-2",
      )}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Choisir la langue de traduction</span>
      <select
        value={prefs.language}
        onChange={(e) => setPref("language", e.target.value as LanguageId)}
        className={cn(
          "appearance-none bg-transparent border-0 outline-none",
          "text-sm font-medium pr-1",
        )}
        aria-label="Langue de traduction"
      >
        {languages.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label_native}
          </option>
        ))}
      </select>
    </label>
  );
}
