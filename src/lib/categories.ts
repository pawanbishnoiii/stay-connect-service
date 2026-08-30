import {
  BookOpen,
  Dumbbell,
  Home,
  Building2,
  BedDouble,
  UtensilsCrossed,
  WashingMachine,
  Zap,
  Sparkles,
  Soup,
  type LucideIcon,
} from "lucide-react";

export type CategoryMeta = {
  slug: string;
  name: string;
  icon: LucideIcon;
  tint: string;
  kind: "place" | "service";
  /** dashboard flavour used by owner tools */
  dashboard: "stay" | "study" | "orders";
  pickup?: boolean;
};

export const CATEGORY_META: CategoryMeta[] = [
  { slug: "library", name: "Library", icon: BookOpen, tint: "bg-violet-100 text-violet-600", kind: "place", dashboard: "study" },
  { slug: "gym", name: "Gym", icon: Dumbbell, tint: "bg-rose-100 text-rose-600", kind: "place", dashboard: "study" },
  { slug: "pg", name: "PG", icon: Home, tint: "bg-emerald-100 text-emerald-600", kind: "place", dashboard: "stay" },
  { slug: "hostel", name: "Hostel", icon: Building2, tint: "bg-amber-100 text-amber-600", kind: "place", dashboard: "stay" },
  { slug: "rooms", name: "Rooms", icon: BedDouble, tint: "bg-orange-100 text-orange-600", kind: "place", dashboard: "stay" },
  { slug: "tiffin", name: "Tiffin", icon: UtensilsCrossed, tint: "bg-lime-100 text-lime-700", kind: "service", dashboard: "orders", pickup: true },
  { slug: "laundry", name: "Washing & Press", icon: WashingMachine, tint: "bg-sky-100 text-sky-600", kind: "service", dashboard: "orders", pickup: true },
  { slug: "electrician", name: "Electrician", icon: Zap, tint: "bg-indigo-100 text-indigo-600", kind: "service", dashboard: "orders" },
  { slug: "cleaning", name: "Cleaning", icon: Sparkles, tint: "bg-teal-100 text-teal-600", kind: "service", dashboard: "orders" },
  { slug: "food", name: "Food", icon: Soup, tint: "bg-pink-100 text-pink-600", kind: "service", dashboard: "orders", pickup: true },
];

export function categoryMeta(slug?: string | null): CategoryMeta {
  return CATEGORY_META.find((c) => c.slug === slug) ?? CATEGORY_META[0]!;
}

export const PICKUP_CATEGORIES = CATEGORY_META.filter((c) => c.pickup).map((c) => c.slug);
