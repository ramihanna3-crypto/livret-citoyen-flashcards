export type CardStatus = "known" | "review";
export type CardEntry = { status: CardStatus; lastSeenAt: number };
export type CardProgress = Record<string, CardEntry>;

export type Prefs = {
  darkMode: "system" | "light" | "dark";
  autoAdvance: boolean;
};

type StoredV1 = { v: 1; cards: CardProgress; prefs: Prefs };

const KEY = "lc.progress.v1";
const DEFAULT_PREFS: Prefs = { darkMode: "system", autoAdvance: true };

function read(): StoredV1 {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { v: 1, cards: {}, prefs: DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    if (parsed?.v !== 1) return { v: 1, cards: {}, prefs: DEFAULT_PREFS };
    return {
      v: 1,
      cards: parsed.cards ?? {},
      prefs: { ...DEFAULT_PREFS, ...(parsed.prefs ?? {}) },
    };
  } catch {
    return { v: 1, cards: {}, prefs: DEFAULT_PREFS };
  }
}

function write(s: StoredV1) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function getProgress(): CardProgress {
  return read().cards;
}

export function markKnown(id: string) {
  const s = read();
  s.cards[id] = { status: "known", lastSeenAt: Date.now() };
  write(s);
}

export function markReview(id: string) {
  const s = read();
  s.cards[id] = { status: "review", lastSeenAt: Date.now() };
  write(s);
}

export function getPrefs(): Prefs {
  return read().prefs;
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  const s = read();
  s.prefs = { ...s.prefs, [key]: value };
  write(s);
}

export function resetProgress() {
  const s = read();
  s.cards = {};
  write(s);
}

export function resetAll() {
  localStorage.removeItem(KEY);
}
