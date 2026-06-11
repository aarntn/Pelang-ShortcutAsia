// Single source of truth for platforms and their brand-adjacent colours.
export const PLATFORMS = [
  { id: "grab",       label: "Grab",       color: "#00B14F" },
  { id: "foodpanda",  label: "Foodpanda",  color: "#D70F64" },
  { id: "lalamove",   label: "Lalamove",   color: "#F16622" },
  { id: "shopeefood", label: "ShopeeFood", color: "#EE4D2D" },
  { id: "maxim",      label: "Maxim",      color: "#F59E0B" },
  { id: "indrive",    label: "inDrive",    color: "#0EA5E9" },
  { id: "other",      label: "Other",      color: "#737373" },
];

export function platformLabel(id) {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function platformColor(id) {
  return PLATFORMS.find((p) => p.id === id)?.color ?? "#737373";
}

export function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}
