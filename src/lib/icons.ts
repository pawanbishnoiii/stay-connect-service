/** 3D icon set cropped from the LocalSpot icon sheet, served from /icons. */
export const APP_ICONS = [
  "home", "search", "map", "nearby", "location", "filter", "calendar", "chat", "notifications", "profile",
  "login", "google", "favorites", "bookmark", "share", "review", "rating", "gallery", "video", "camera",
  "room", "pg", "hostel", "library", "gym", "tiffin", "laundry", "electrician", "cleaning", "food",
  "add-property", "add-service", "my-listings", "dashboard", "bookings", "payments", "wallet", "invoices", "analytics", "balance",
  "wifi", "parking", "ac", "fan", "fridge", "washing-machine", "hot-water", "attached-bath", "common-bath", "power-backup",
  "veg", "non-veg", "offers", "support", "messages", "edit-profile", "settings", "help", "logout", "dark-mode",
] as const;

export type AppIconName = (typeof APP_ICONS)[number];

export function iconUrl(name: AppIconName | string): string {
  return `/icons/${name}.png`;
}

/** category slug -> icon name */
export const CATEGORY_ICON: Record<string, AppIconName> = {
  library: "library",
  gym: "gym",
  pg: "pg",
  hostel: "hostel",
  rooms: "room",
  tiffin: "tiffin",
  laundry: "washing-machine",
  electrician: "electrician",
  cleaning: "cleaning",
  food: "food",
};

/** amenity keyword -> icon name */
export const AMENITY_ICON: Record<string, AppIconName> = {
  wifi: "wifi",
  parking: "parking",
  ac: "ac",
  fan: "fan",
  fridge: "fridge",
  "washing machine": "washing-machine",
  laundry: "washing-machine",
  "hot water": "hot-water",
  "attached bathroom": "attached-bath",
  "common bathroom": "common-bath",
  "power backup": "power-backup",
  food: "food",
};

export function amenityIcon(label: string): AppIconName {
  const key = label.trim().toLowerCase();
  return AMENITY_ICON[key] ?? (Object.entries(AMENITY_ICON).find(([k]) => key.includes(k))?.[1] as AppIconName) ?? "bookmark";
}
