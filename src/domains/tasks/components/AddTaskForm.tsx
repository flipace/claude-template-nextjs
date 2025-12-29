"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import type { Priority } from "@/lib/types";
import type { Category } from "@/db/schema";
import { PRIORITY_LABELS, TIME_ESTIMATES, PRIORITIES } from "@/lib/types";
import { getPriorityStyles, getCategoryStyles } from "@/domains/shared";

interface AddTaskFormProps {
  isDark: boolean;
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (data: {
    title: string;
    priority: Priority;
    categoryId?: string;
    estimatedMinutes?: number;
  }) => Promise<boolean>;
  onClose: () => void;
}

export function AddTaskForm({
  isDark,
  categories,
  isSubmitting,
  onSubmit,
  onClose,
}: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    const success = await onSubmit({
      title: title.trim(),
      priority,
      categoryId: categoryId || undefined,
      estimatedMinutes: estimatedMinutes || undefined,
    });

    if (success) {
      setTitle("");
      setPriority("medium");
      setCategoryId(null);
      setEstimatedMinutes(null);
      onClose();
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={handleSubmit}
      className="bg-card border rounded-xl p-4 space-y-4"
    >
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder="Was möchtest du erledigen?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 h-12 text-base"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-12 w-12 shrink-0"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              priority === p
                ? getPriorityStyles(p, isDark)
                : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
            }`}
          >
            {PRIORITY_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {TIME_ESTIMATES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setEstimatedMinutes(estimatedMinutes === t.value ? null : t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              estimatedMinutes === t.value
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                categoryId === cat.id
                  ? getCategoryStyles(cat.color, isDark)
                  : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      <Button
        type="submit"
        disabled={!title.trim() || isSubmitting}
        className="w-full h-10 bg-primary hover:bg-primary/90"
      >
        {isSubmitting ? "Speichern..." : "Hinzufügen"}
      </Button>
    </motion.form>
  );
}

interface AddTaskButtonProps {
  onClick: () => void;
}

export function AddTaskButton({ onClick }: AddTaskButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-5 h-5" />
      <span className="font-medium">Neue Aufgabe</span>
    </motion.button>
  );
}
