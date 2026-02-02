
export enum Rarity {
  MIL_SPEC = 'MIL_SPEC', // Blue
  RESTRICTED = 'RESTRICTED', // Purple
  CLASSIFIED = 'CLASSIFIED', // Pink
  COVERT = 'COVERT', // Red
  GOLD = 'GOLD', // Rare Special (Knives/Gloves)
}

export interface Skin {
  id: string;
  name: string;
  weapon: string;
  rarity: Rarity;
  price: number;
  imageUrl: string;
}

export interface Review {
  username: string;
  rating: number;
  comment: string;
  date: number;
}

export interface Case {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  skins: Skin[];
  reviews: Review[];
  rarityTier?: Rarity; // Visual indicator for case quality
  hasGold?: boolean; // Whether this case contains rare special items
}

export interface InventoryItem extends Skin {
  instanceId: string;
  acquiredAt: number;
}

export type View = 'LOBBY' | 'CASE_OPEN' | 'INVENTORY' | 'AI_ANALYSIS' | 'ADMIN' | 'SHOP' | 'PAYMENT' | 'WITHDRAW' | 'AUTH';

export type PaymentProvider = 'PAYPAL' | 'DANA' | 'GOPAY' | 'SEABANK' | 'QRIS';

export interface User {
  username: string;
  email: string;
  balance: number;
}
