import { cn } from "@/lib/utils";

type Props = { className?: string; orientation?: "vertical" | "horizontal" };

export function FlagAccent({ className, orientation = "vertical" }: Props) {
  const wrap =
    orientation === "vertical"
      ? "flex flex-col w-1 h-full"
      : "flex flex-row h-[2px] w-6";
  const seg = orientation === "vertical" ? "flex-1 w-full" : "flex-1 h-full";

  return (
    <div className={cn(wrap, className)} aria-hidden="true">
      <div data-flag-segment="blue"  className={cn(seg, "bg-[var(--color-flag-blue)]")} />
      <div data-flag-segment="white" className={cn(seg, "bg-[var(--color-flag-white)]")} />
      <div data-flag-segment="red"   className={cn(seg, "bg-[var(--color-flag-red)]")} />
    </div>
  );
}
