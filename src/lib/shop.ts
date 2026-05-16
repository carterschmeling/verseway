export type ShopItemKind = "consumable" | "cosmetic";

export interface ShopItemDef {
  id: string;
  kind: ShopItemKind;
  title: string;
  emoji: string;
  description: string;
  costGems: number;
  /** XP granted when buying (consumables only) */
  xpBonus?: number;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  {
    id: "sip_wisdom",
    kind: "consumable",
    title: "Wisdom sip",
    emoji: "🫖",
    description: "A small burst of focus — +12 XP.",
    costGems: 14,
    xpBonus: 12,
  },
  {
    id: "honeycomb",
    kind: "consumable",
    title: "Honeycomb snack",
    emoji: "🍯",
    description: "Sweet memory boost — +28 XP.",
    costGems: 26,
    xpBonus: 28,
  },
  {
    id: "flask_clay",
    kind: "cosmetic",
    title: "Clay flask keepsake",
    emoji: "🏺",
    description: "Equip a vintage flair on your profile.",
    costGems: 40,
  },
  {
    id: "crown_paper",
    kind: "cosmetic",
    title: "Paper crown",
    emoji: "👑",
    description: "Celebrate small wins — profile title.",
    costGems: 55,
  },
];

export function shopItem(id: string): ShopItemDef | undefined {
  return SHOP_ITEMS.find((x) => x.id === id);
}

export function flairLabel(flairId: string | null | undefined): string | null {
  if (!flairId) return null;
  if (flairId === "flask_clay") return "Keeper of the flask";
  if (flairId === "crown_paper") return "Paper-crown scholar";
  return null;
}
