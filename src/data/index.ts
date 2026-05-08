import { CardArray, type Card, type ThemeId } from "@/lib/card";
import valeurs from "./cards/valeurs.json";
import droitsDevoirs from "./cards/droits-devoirs.json";
import institutions from "./cards/institutions.json";
import histoire from "./cards/histoire.json";
import geographie from "./cards/geographie.json";
import ddhc from "./cards/ddhc.json";

const raw = [...valeurs, ...droitsDevoirs, ...institutions, ...histoire, ...geographie, ...ddhc];

export const allCards: Card[] = CardArray.parse(raw);

export function cardsByTheme(theme: ThemeId): Card[] {
  return allCards.filter((c) => c.theme === theme);
}
