"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Bell, Palette } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ITEM_COLORS, getItemColorStyles, type ItemColor } from "@/domains/shared";

interface AddNoteFormProps {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  color: ItemColor;
  setColor: (color: ItemColor) => void;
  remindAt: string;
  setRemindAt: (date: string) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AddNoteForm({
  title,
  setTitle,
  content,
  setContent,
  color,
  setColor,
  remindAt,
  setRemindAt,
  isEditing,
  isSubmitting,
  onSubmit,
  onCancel,
}: AddNoteFormProps) {
  const colorStyles = getItemColorStyles(color);

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={onSubmit}
      className={`border rounded-xl p-4 space-y-4 ${colorStyles.bg} ${colorStyles.border}`}
    >
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder="Titel der Notiz"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 h-12 text-base bg-background/50"
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

      <RichTextEditor
        value={content}
        onChange={(_, text) => setContent(text)}
        placeholder="Notiz schreiben... (optional)"
      />

      {/* Color Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Farbe
        </label>
        <div className="flex flex-wrap gap-2">
          {ITEM_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${c.bg} ${
                color === c.value
                  ? "ring-2 ring-primary ring-offset-2"
                  : "hover:scale-110"
              } ${c.border}`}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <Input
          type="datetime-local"
          value={remindAt}
          onChange={(e) => setRemindAt(e.target.value)}
          className="flex-1 h-10 bg-background/50"
          placeholder="Erinnerung setzen"
        />
      </div>

      <Button
        type="submit"
        disabled={!title.trim() || isSubmitting}
        className="w-full h-10 bg-primary hover:bg-primary/90"
      >
        {isSubmitting ? "Speichern..." : isEditing ? "Aktualisieren" : "Notiz erstellen"}
      </Button>
    </motion.form>
  );
}

interface AddNoteButtonProps {
  onClick: () => void;
}

export function AddNoteButton({ onClick }: AddNoteButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-5 h-5" />
      <span className="font-medium">Neue Notiz</span>
    </motion.button>
  );
}
