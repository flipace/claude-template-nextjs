"use client";

import { motion } from "framer-motion";
import { Bell, Edit3, Pin, Trash2 } from "lucide-react";
import type { Note } from "@/db/schema";
import { getItemColorStyles, formatDate } from "@/domains/shared";

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

export function NoteCard({ note, onEdit, onTogglePin, onDelete }: NoteCardProps) {
  const colorStyles = getItemColorStyles(note.color);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border ${colorStyles.bg} ${colorStyles.border}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {note.isPinned && (
              <Pin className="w-3 h-3 text-primary shrink-0" />
            )}
            <p className="text-base font-medium text-foreground truncate">
              {note.title}
            </p>
          </div>
          {note.content && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-4 whitespace-pre-wrap">
              {note.content}
            </p>
          )}
          {note.remindAt && (
            <div className="flex items-center gap-1 mt-3 text-xs text-amber-600 dark:text-amber-400">
              <Bell className="w-3 h-3" />
              {formatDate(note.remindAt)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-current/10">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Bearbeiten"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onTogglePin}
          className={`p-2 rounded-lg transition-colors ${
            note.isPinned
              ? "bg-primary/10 text-primary"
              : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
          }`}
          aria-label={note.isPinned ? "Nicht mehr anpinnen" : "Anpinnen"}
        >
          <Pin className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
          aria-label="Löschen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
