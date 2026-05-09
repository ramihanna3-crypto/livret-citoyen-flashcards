import type { Card } from "@/lib/card";
import { shuffled } from "@/lib/shuffle";

export type SessionState = {
  deck: Card[];
  cursor: number;
  flipped: boolean;
  shuffled: boolean;
  finished: boolean;
};

export type SessionAction =
  | { type: "FLIP" }
  | { type: "PREV" }
  | { type: "NEXT" }
  | { type: "JUMP"; to: number }
  | { type: "SHUFFLE" }
  | { type: "RESTART"; deck?: Card[] };

export function initSession(deck: Card[]): SessionState {
  return { deck, cursor: 0, flipped: false, shuffled: false, finished: false };
}

export function sessionReducer(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case "FLIP":
      return { ...s, flipped: !s.flipped };
    case "PREV":
      return { ...s, cursor: Math.max(0, s.cursor - 1), flipped: false, finished: false };
    case "NEXT": {
      const last = s.deck.length - 1;
      if (s.cursor >= last) return { ...s, cursor: last, flipped: false, finished: true };
      return { ...s, cursor: s.cursor + 1, flipped: false };
    }
    case "JUMP":
      return {
        ...s,
        cursor: Math.max(0, Math.min(a.to, s.deck.length - 1)),
        flipped: false,
        finished: false,
      };
    case "SHUFFLE":
      return {
        ...s,
        deck: shuffled(s.deck),
        cursor: 0,
        flipped: false,
        shuffled: true,
        finished: false,
      };
    case "RESTART":
      return initSession(a.deck ?? s.deck);
  }
}
