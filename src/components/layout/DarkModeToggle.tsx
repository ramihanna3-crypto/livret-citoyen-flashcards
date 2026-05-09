import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/utils";

export function DarkModeToggle() {
  const { mode, cycle } = useTheme();
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const labelMap = { system: "Système", light: "Clair", dark: "Sombre" } as const;

  return (
    <button
      type="button"
      onClick={cycle}
      data-mode={mode}
      aria-label={`Thème : ${labelMap[mode]} (cliquer pour changer)`}
      className={cn(
        "h-9 w-9 inline-flex items-center justify-center rounded-md",
        "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        "hover:bg-[var(--color-muted)] transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
