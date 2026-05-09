import { DeckPicker } from "@/components/deck/DeckPicker";

export function Home() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">
        Choisissez un thème ·{" "}
        <span dir="rtl" lang="ar">
          اختر موضوعًا
        </span>
      </h2>
      <DeckPicker />
    </section>
  );
}
