import type { Priority } from "@/lib/types";

// Note/List colors
export type ItemColor = "default" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink";

export const ITEM_COLORS: { value: ItemColor; label: string; bg: string; border: string }[] = [
  { value: "default", label: "Standard", bg: "bg-card", border: "border-border" },
  { value: "red", label: "Rot", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  { value: "orange", label: "Orange", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800" },
  { value: "yellow", label: "Gelb", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800" },
  { value: "green", label: "Grün", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800" },
  { value: "blue", label: "Blau", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
  { value: "purple", label: "Lila", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800" },
  { value: "pink", label: "Pink", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-800" },
];

export const getItemColorStyles = (color: string | null | undefined) => {
  const found = ITEM_COLORS.find((c) => c.value === color);
  return found || ITEM_COLORS[0];
};

// Priority styles
export const getPriorityStyles = (priority: Priority, isDark: boolean) => {
  const styles = {
    low: isDark
      ? "bg-stone-700 text-stone-300 border-stone-600"
      : "bg-stone-100 text-stone-600 border-stone-200",
    medium: isDark
      ? "bg-amber-900/50 text-amber-300 border-amber-700"
      : "bg-amber-50 text-amber-700 border-amber-200",
    high: isDark
      ? "bg-red-900/50 text-red-300 border-red-700"
      : "bg-red-50 text-red-600 border-red-200",
  };
  return styles[priority];
};

// Category colors
export const getCategoryStyles = (color: string, isDark: boolean) => {
  const darkColors: Record<string, string> = {
    rose: "bg-rose-900/50 text-rose-300 border-rose-700",
    pink: "bg-pink-900/50 text-pink-300 border-pink-700",
    fuchsia: "bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-700",
    purple: "bg-purple-900/50 text-purple-300 border-purple-700",
    violet: "bg-violet-900/50 text-violet-300 border-violet-700",
    indigo: "bg-indigo-900/50 text-indigo-300 border-indigo-700",
    blue: "bg-blue-900/50 text-blue-300 border-blue-700",
    sky: "bg-sky-900/50 text-sky-300 border-sky-700",
    cyan: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
    teal: "bg-teal-900/50 text-teal-300 border-teal-700",
    emerald: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    green: "bg-green-900/50 text-green-300 border-green-700",
    lime: "bg-lime-900/50 text-lime-300 border-lime-700",
    yellow: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    amber: "bg-amber-900/50 text-amber-300 border-amber-700",
    orange: "bg-orange-900/50 text-orange-300 border-orange-700",
  };

  const lightColors: Record<string, string> = {
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    fuchsia: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    green: "bg-green-50 text-green-700 border-green-200",
    lime: "bg-lime-50 text-lime-700 border-lime-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const colors = isDark ? darkColors : lightColors;
  return colors[color] || colors.orange;
};

// Time formatting
export const formatTime = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

// Date formatting
export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
};

export const formatFullDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
};
