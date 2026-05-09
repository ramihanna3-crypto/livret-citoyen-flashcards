import { useState } from "react";
import { Flashcard } from "@/components/flashcard/Flashcard";
import { allCards } from "@/data";

export default function App() {
  const [flipped, setFlipped] = useState(false);
  const card = allCards[0];
  return (
    <main className="min-h-screen p-4 sm:p-8 bg-[var(--color-background)]">
      <h1 className="text-2xl font-semibold mb-6 text-center">Livret du Citoyen</h1>
      <Flashcard
        card={card}
        position={1}
        total={allCards.length}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onKnown={() => alert("Je sais")}
        onReview={() => alert("À revoir")}
      />
    </main>
  );
}
