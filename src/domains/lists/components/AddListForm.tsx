"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

const LIST_ICONS = ["🛒", "📝", "🎁", "🏠", "💼", "🎯", "📚", "🍕", "✈️", "💪", "🎮", "🎵"];

interface AddListFormProps {
  name: string;
  setName: (name: string) => void;
  icon: string;
  setIcon: (icon: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AddListForm({
  name,
  setName,
  icon,
  setIcon,
  isSubmitting,
  onSubmit,
  onCancel,
}: AddListFormProps) {
  const cycleIcon = () => {
    const currentIndex = LIST_ICONS.indexOf(icon);
    setIcon(LIST_ICONS[(currentIndex + 1) % LIST_ICONS.length]);
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={onSubmit}
      className="bg-card border rounded-xl p-4 space-y-4"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cycleIcon}
          className="w-12 h-12 text-2xl bg-secondary rounded-lg hover:bg-accent transition-colors shrink-0 flex items-center justify-center"
        >
          {icon}
        </button>
        <Input
          autoFocus
          placeholder="Name der Liste"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 h-12 text-base"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-12 w-12 shrink-0"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      <Button
        type="submit"
        disabled={!name.trim() || isSubmitting}
        className="w-full h-10 bg-primary hover:bg-primary/90"
      >
        {isSubmitting ? "Erstellen..." : "Liste erstellen"}
      </Button>
    </motion.form>
  );
}

interface AddListButtonProps {
  onClick: () => void;
}

export function AddListButton({ onClick }: AddListButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-5 h-5" />
      <span className="font-medium">Neue Liste</span>
    </motion.button>
  );
}
