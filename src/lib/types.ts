import { z } from "zod";

// User types
export interface User {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

export interface Author {
  username: string | null;
  displayName: string | null;
  avatar: string | null;
}

// Prioritäten
export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "text-zinc-400 bg-zinc-800",
  medium: "text-amber-400 bg-amber-950",
  high: "text-rose-400 bg-rose-950",
};

// Vordefinierte Farben für Kategorien
export const CATEGORY_COLORS = [
  "rose",
  "pink",
  "fuchsia",
  "purple",
  "violet",
  "indigo",
  "blue",
  "sky",
  "cyan",
  "teal",
  "emerald",
  "green",
  "lime",
  "yellow",
  "amber",
  "orange",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

// Zeitschätzungen in Minuten
export const TIME_ESTIMATES = [
  { value: 5, label: "5 Min" },
  { value: 15, label: "15 Min" },
  { value: 30, label: "30 Min" },
  { value: 60, label: "1 Std" },
  { value: 120, label: "2 Std" },
  { value: 240, label: "4 Std" },
] as const;

// Task Schema
export const taskFormSchema = z.object({
  title: z.string().min(1, "Titel wird benötigt"),
  notes: z.string().optional(),
  categoryId: z.string().optional(),
  priority: z.enum(PRIORITIES).default("medium"),
  estimatedMinutes: z.number().optional(),
  startDate: z.string().optional(), // ISO date string - Startdatum
  dueDate: z.string().optional(), // ISO date string - Enddatum
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

// Category Schema
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name wird benötigt"),
  color: z.string(),
  icon: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

// Task mit Category
export interface TaskWithCategory {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  notes: string | null;
  priority: Priority;
  estimatedMinutes: number | null;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  isCompleted: boolean;
  createdAt: Date;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
}
