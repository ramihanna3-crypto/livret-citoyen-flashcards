import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { FlagAccent } from "@/components/flashcard/FlagAccent";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur border-b border-[var(--color-border)]">
      <div className="mx-auto w-full max-w-[960px] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="inline-flex flex-col">
          <span className="font-semibold text-base sm:text-lg leading-none">
            Livret du Citoyen{" "}
            <span dir="rtl" lang="ar" className="text-[var(--color-muted-foreground)] font-normal">
              · كتيب المواطن
            </span>
          </span>
          <FlagAccent orientation="horizontal" className="mt-1" />
        </Link>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <Link
            to="/about"
            aria-label="À propos"
            className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
