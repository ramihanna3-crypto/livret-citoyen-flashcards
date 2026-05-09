import { useEffect } from "react";
import { useProgress } from "@/lib/useProgress";

export function useTheme() {
  const { prefs, setPref } = useProgress();

  useEffect(() => {
    function apply() {
      const wantDark =
        prefs.darkMode === "dark" ||
        (prefs.darkMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", wantDark);
    }
    apply();
    if (prefs.darkMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [prefs.darkMode]);

  function cycle() {
    const order: Array<typeof prefs.darkMode> = ["system", "light", "dark"];
    const next = order[(order.indexOf(prefs.darkMode) + 1) % order.length];
    setPref("darkMode", next);
  }

  return { mode: prefs.darkMode, cycle };
}
