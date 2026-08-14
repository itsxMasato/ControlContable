import {
  Banknote,
  BookOpen,
  Car,
  CreditCard,
  Ellipsis,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  Popcorn,
  Shield,
  Tag,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  popcorn: Popcorn,
  'heart-pulse': HeartPulse,
  'book-open': BookOpen,
  banknote: Banknote,
  ellipsis: Ellipsis,
  landmark: Landmark,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  wallet: Wallet,
  shield: Shield,
  plane: Plane,
  laptop: Laptop,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Tag;
}
