"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Trash2,
  Circle,
  CheckCircle2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Calendar,
  CalendarRange,
} from "lucide-react";
import type { TaskWithCategory, Priority } from "@/lib/types";
import type { Category } from "@/db/schema";
import { PRIORITY_LABELS, TIME_ESTIMATES, PRIORITIES } from "@/lib/types";
import { getPriorityStyles, getCategoryStyles, formatTime } from "@/domains/shared";

interface SortableTaskProps {
  task: TaskWithCategory;
  isDark: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onUpdate: (data: Partial<TaskWithCategory>) => void;
  categories: Category[];
}

export function SortableTask({
  task,
  isDark,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onUpdate,
  categories,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority as Priority);
  const [editCategory, setEditCategory] = useState<string | null>(task.categoryId);
  const [editTime, setEditTime] = useState<number | null>(task.estimatedMinutes);
  const [editStartDate, setEditStartDate] = useState<string>(
    task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : ""
  );
  const [editDueDate, setEditDueDate] = useState<string>(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [showDateRange, setShowDateRange] = useState(!!task.startDate);

  // Format date for display
  const formatDateDisplay = (date: Date | null | string) => {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  };

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      priority: editPriority,
      categoryId: editCategory,
      estimatedMinutes: editTime,
      startDate: editStartDate ? new Date(editStartDate) : null,
      dueDate: editDueDate ? new Date(editDueDate) : null,
    });
    onToggleExpand();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-xl ${isDragging ? "opacity-50 shadow-lg" : ""} ${
        task.isCompleted ? "opacity-60" : ""
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 shrink-0 text-muted-foreground hover:text-foreground touch-none"
            aria-label="Ziehen zum Sortieren"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Checkbox */}
          <button
            onClick={onToggleComplete}
            className="mt-0.5 shrink-0 touch-manipulation"
            aria-label={task.isCompleted ? "Als offen markieren" : "Als erledigt markieren"}
          >
            {task.isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-base ${
                task.isCompleted
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </p>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityStyles(
                  task.priority as Priority,
                  isDark
                )}`}
              >
                {PRIORITY_LABELS[task.priority as Priority]}
              </span>

              {task.category && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryStyles(
                    task.category.color,
                    isDark
                  )}`}
                >
                  {task.category.icon} {task.category.name}
                </span>
              )}

              {task.estimatedMinutes && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(task.estimatedMinutes)}
                </span>
              )}

              {/* Date display */}
              {(task.startDate || task.dueDate) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {task.startDate && task.dueDate ? (
                    <>
                      <CalendarRange className="w-3 h-3" />
                      {formatDateDisplay(task.startDate)} - {formatDateDisplay(task.dueDate)}
                    </>
                  ) : task.dueDate ? (
                    <>
                      <Calendar className="w-3 h-3" />
                      {formatDateDisplay(task.dueDate)}
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3 h-3" />
                      Ab {formatDateDisplay(task.startDate)}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              aria-label="Bearbeiten"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation"
              aria-label="Löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Edit Form */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
          >
            <div className="p-4 space-y-4 bg-accent/30">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Titel</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priorität</label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setEditPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        editPriority === p
                          ? getPriorityStyles(p, isDark)
                          : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Bereich</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditCategory(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        !editCategory
                          ? "bg-foreground text-background border-transparent"
                          : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                      }`}
                    >
                      Keiner
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setEditCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          editCategory === cat.id
                            ? getCategoryStyles(cat.color, isDark)
                            : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Zeitaufwand</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditTime(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      !editTime
                        ? "bg-foreground text-background border-transparent"
                        : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                    }`}
                  >
                    Egal
                  </button>
                  {TIME_ESTIMATES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setEditTime(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        editTime === t.value
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date / Date Range */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Datum</label>
                  <button
                    onClick={() => setShowDateRange(!showDateRange)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      showDateRange
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    <CalendarRange className="w-3 h-3" />
                    Zeitraum
                  </button>
                  {(editStartDate || editDueDate) && (
                    <button
                      onClick={() => {
                        setEditStartDate("");
                        setEditDueDate("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Löschen
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {showDateRange && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">Von</label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-sm bg-secondary border border-transparent focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">
                      {showDateRange ? "Bis" : "Fällig am"}
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-secondary border border-transparent focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
                  Speichern
                </Button>
                <Button variant="outline" onClick={onToggleExpand}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
