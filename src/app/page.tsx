"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import {
  LogIn,
  LogOut,
  Plus,
  Check,
  Clock,
  Trash2,
  X,
  Circle,
  CheckCircle2,
  Sun,
  Moon,
  ListTodo,
  Flame,
  Timer,
  Target,
  Zap,
  Calendar,
  GripVertical,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Bell,
  Pin,
  Palette,
  Edit3,
  Search,
  ShoppingCart,
  MoreVertical,
} from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { User as UserType, TaskWithCategory, Priority } from "@/lib/types";
import {
  PRIORITY_LABELS,
  TIME_ESTIMATES,
  PRIORITIES,
} from "@/lib/types";
import type { Category, Note, List, ListItem } from "@/db/schema";

// Note colors
type NoteColor = "default" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink";

const NOTE_COLORS: { value: NoteColor; label: string; bg: string; border: string }[] = [
  { value: "default", label: "Standard", bg: "bg-card", border: "border-border" },
  { value: "red", label: "Rot", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  { value: "orange", label: "Orange", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800" },
  { value: "yellow", label: "Gelb", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800" },
  { value: "green", label: "Grün", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800" },
  { value: "blue", label: "Blau", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
  { value: "purple", label: "Lila", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800" },
  { value: "pink", label: "Pink", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-800" },
];

const getNoteColorStyles = (color: string | null | undefined) => {
  const found = NOTE_COLORS.find((c) => c.value === color);
  return found || NOTE_COLORS[0];
};

// Priority styles - warm colors
const getPriorityStyles = (priority: Priority, isDark: boolean) => {
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

// Category colors - warm palette
const getCategoryStyles = (color: string, isDark: boolean) => {
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

// Sortable Task Item
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

function SortableTask({
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

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      priority: editPriority,
      categoryId: editCategory,
      estimatedMinutes: editTime,
    });
    onToggleExpand();
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
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

export default function Home() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes" | "lists">("tasks");

  // Lists state
  type ListWithItems = List & { items: ListItem[] };
  const [lists, setLists] = useState<ListWithItems[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListIcon, setNewListIcon] = useState("🛒");
  const [showAddListForm, setShowAddListForm] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);

  // Time planning state
  const [availableTime, setAvailableTime] = useState<number | null>(null);
  const [showTimePlanner, setShowTimePlanner] = useState(false);

  // Form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [newTaskCategory, setNewTaskCategory] = useState<string | null>(null);
  const [newTaskTime, setNewTaskTime] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notes form state
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>("default");
  const [newNoteRemindAt, setNewNoteRemindAt] = useState("");
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");

  // Expanded task for editing
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch tasks, categories, notes, and lists
  const fetchData = useCallback(async () => {
    if (!user) return;

    const [tasksRes, categoriesRes, notesRes, listsRes] = await Promise.all([
      fetch(`/api/tasks?completed=${showCompleted}`),
      fetch("/api/categories"),
      fetch("/api/notes"),
      fetch("/api/lists"),
    ]);

    if (tasksRes.ok) {
      const data = await tasksRes.json();
      setTasks(data.tasks);
    }

    if (categoriesRes.ok) {
      const data = await categoriesRes.json();
      setCategories(data.categories);
    }

    if (notesRes.ok) {
      const data = await notesRes.json();
      setNotes(data.notes);
    }

    if (listsRes.ok) {
      const data = await listsRes.json();
      setLists(data.lists);
    }
  }, [user, showCompleted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          categoryId: newTaskCategory || undefined,
          estimatedMinutes: newTaskTime || undefined,
        }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        setNewTaskPriority("medium");
        setNewTaskCategory(null);
        setNewTaskTime(null);
        setShowAddForm(false);
        fetchData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNoteTitle.trim(),
          content: newNoteContent || undefined,
          color: newNoteColor,
          remindAt: newNoteRemindAt || undefined,
        }),
      });

      if (res.ok) {
        setNewNoteTitle("");
        setNewNoteContent("");
        setNewNoteColor("default");
        setNewNoteRemindAt("");
        setShowAddNoteForm(false);
        fetchData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async (noteId: string, data: Partial<Note>) => {
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingNoteId(null);
    fetchData();
  };

  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content || "");
    setNewNoteColor((note.color as NoteColor) || "default");
    setNewNoteRemindAt(note.remindAt ? new Date(note.remindAt).toISOString().slice(0, 16) : "");
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteColor("default");
    setNewNoteRemindAt("");
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !isCompleted }),
    });
    fetchData();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchData();
  };

  const handleUpdateTask = async (taskId: string, data: Partial<TaskWithCategory>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchData();
  };

  const handleDeleteNote = async (noteId: string) => {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    fetchData();
  };

  const handleTogglePinNote = async (noteId: string, isPinned: boolean) => {
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !isPinned }),
    });
    fetchData();
  };

  // List handlers
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName.trim(),
          icon: newListIcon,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewListName("");
        setNewListIcon("🛒");
        setShowAddListForm(false);
        setActiveListId(data.list.id);
        fetchData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    if (activeListId === listId) {
      setActiveListId(null);
    }
    fetchData();
  };

  const handleUpdateList = async (listId: string, data: { name?: string; icon?: string }) => {
    await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingListId(null);
    fetchData();
  };

  const handleAddItem = async (listId: string) => {
    if (!newItemText.trim()) return;

    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newItemText.trim() }),
    });

    if (res.ok) {
      setNewItemText("");
      fetchData();
    }
  };

  const handleToggleItem = async (listId: string, itemId: string, isChecked: boolean) => {
    await fetch(`/api/lists/${listId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked: !isChecked }),
    });
    fetchData();
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    await fetch(`/api/lists/${listId}/items/${itemId}`, { method: "DELETE" });
    fetchData();
  };

  const handleClearCheckedItems = async (listId: string) => {
    await fetch(`/api/lists/${listId}/items`, { method: "DELETE" });
    fetchData();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
      setTasks(newOrder);

      // Save new order to backend
      await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: newOrder.map((t) => t.id) }),
      });
    }
  };

  // Filter tasks
  const filteredTasks = filterCategory
    ? tasks.filter((t) => t.categoryId === filterCategory)
    : tasks;

  // Sort by sortOrder (manual order takes precedence)
  const sortedTasks = [...filteredTasks];

  // Stats
  const openTasks = tasks.filter((t) => !t.isCompleted);
  const totalOpen = openTasks.length;
  const highPriorityCount = openTasks.filter((t) => t.priority === "high").length;
  const totalEstimatedTime = openTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  // Smart task suggestions based on available time
  const suggestedTasks = useMemo(() => {
    if (!availableTime) return [];

    const tasksWithTime = openTasks
      .filter((t) => t.estimatedMinutes && t.estimatedMinutes <= availableTime)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority as Priority] ?? 1) - (priorityOrder[b.priority as Priority] ?? 1);
      });

    const result: TaskWithCategory[] = [];
    let remainingTime = availableTime;

    for (const task of tasksWithTime) {
      if (task.estimatedMinutes && task.estimatedMinutes <= remainingTime) {
        result.push(task);
        remainingTime -= task.estimatedMinutes;
      }
    }

    return result;
  }, [availableTime, openTasks]);

  const suggestedTime = suggestedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  // Notes with upcoming reminders
  const upcomingReminders = notes.filter((n) => {
    if (!n.remindAt) return false;
    const remindDate = new Date(n.remindAt);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return remindDate >= now && remindDate <= tomorrow;
  });

  // Filtered notes by search
  const filteredNotes = useMemo(() => {
    if (!noteSearchQuery.trim()) return notes;
    const query = noteSearchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query))
    );
  }, [notes, noteSearchQuery]);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-sm w-full"
        >
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Target className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Miri's Mindspace
            </h1>
            <p className="text-muted-foreground">
              Dein persönlicher Raum für Aufgaben und Gedanken
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Überblick behalten</p>
                <p className="text-xs text-muted-foreground">Alle Aufgaben auf einen Blick</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Notizen & Erinnerungen</p>
                <p className="text-xs text-muted-foreground">Gedanken festhalten</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Zeit planen</p>
                <p className="text-xs text-muted-foreground">Realistisch einteilen</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link href="/signup" className="block">
              <Button className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                <Zap className="w-5 h-5 mr-2" />
                Jetzt starten
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full h-12 text-base">
                <LogIn className="w-5 h-5 mr-2" />
                Einloggen
              </Button>
            </Link>
          </div>

          <button
            onClick={toggleTheme}
            className="mx-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? "Helles Design" : "Dunkles Design"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-primary">Mindspace</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Theme wechseln"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.displayName || user.username}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Erinnerungen
              </span>
            </div>
            <div className="space-y-2">
              {upcomingReminders.map((note) => (
                <div key={note.id} className="text-sm text-amber-700 dark:text-amber-400">
                  {note.title} - {formatDate(note.remindAt!)}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-3">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tasks"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Aufgaben
            {totalOpen > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">
                {totalOpen}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "notes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <StickyNote className="w-4 h-4" />
            Notizen
            {notes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">
                {notes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("lists")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "lists"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Listen
            {lists.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">
                {lists.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "tasks" ? (
          <>
            {/* Time Planner Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Hallo {user.displayName || user.username}!
              </p>
              <button
                onClick={() => setShowTimePlanner(!showTimePlanner)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  showTimePlanner || availableTime
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Zeitplanung
              </button>
            </div>

            {/* Time Planner */}
            <AnimatePresence>
              {showTimePlanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card border rounded-xl p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Wie viel Zeit hast du?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[30, 60, 90, 120, 180, 240].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => setAvailableTime(availableTime === mins ? null : mins)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                              availableTime === mins
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                            }`}
                          >
                            {formatTime(mins)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {availableTime && suggestedTasks.length > 0 && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Das passt rein
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(suggestedTime)} von {formatTime(availableTime)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {suggestedTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-accent/50"
                            >
                              <button
                                onClick={() => handleToggleComplete(task.id, task.isCompleted)}
                                className="shrink-0"
                              >
                                <Circle className="w-5 h-5 text-primary" />
                              </button>
                              <span className="flex-1 text-sm text-foreground truncate">
                                {task.title}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {task.estimatedMinutes}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableTime && suggestedTasks.length === 0 && (
                      <p className="text-sm text-muted-foreground pt-2 border-t">
                        Keine passenden Aufgaben. Füge Zeitangaben hinzu!
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <ListTodo className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{totalOpen}</div>
                <div className="text-xs text-muted-foreground">Offen</div>
              </div>

              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {highPriorityCount}
                </div>
                <div className="text-xs text-muted-foreground">Dringend</div>
              </div>

              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatTime(totalEstimatedTime)}
                </div>
                <div className="text-xs text-muted-foreground">Aufwand</div>
              </div>
            </div>

            {/* Add Task */}
            <AnimatePresence mode="wait">
              {!showAddForm ? (
                <motion.button
                  key="add-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Neue Aufgabe</span>
                </motion.button>
              ) : (
                <motion.form
                  key="add-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleAddTask}
                  className="bg-card border rounded-xl p-4 space-y-4"
                >
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Was möchtest du erledigen?"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1 h-12 text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAddForm(false)}
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
                        onClick={() => setNewTaskPriority(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          newTaskPriority === p
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
                        onClick={() => setNewTaskTime(newTaskTime === t.value ? null : t.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          newTaskTime === t.value
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
                          onClick={() => setNewTaskCategory(newTaskCategory === cat.id ? null : cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                            newTaskCategory === cat.id
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
                    disabled={!newTaskTitle.trim() || isSubmitting}
                    className="w-full h-10 bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? "Speichern..." : "Hinzufügen"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Deine Aufgaben</h2>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  showCompleted
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Check className="w-4 h-4" />
                {showCompleted ? "Nur offene" : "Erledigte"}
              </button>
            </div>

            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all shrink-0 ${
                    !filterCategory
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Alle
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border shrink-0 ${
                      filterCategory === cat.id
                        ? getCategoryStyles(cat.color, isDark)
                        : "bg-secondary text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Task List with DnD */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedTasks.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-foreground font-medium">
                        {showCompleted ? "Keine erledigten Aufgaben" : "Keine offenen Aufgaben"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {showCompleted ? "Fang an abzuhaken!" : "Zeit zum Durchatmen!"}
                      </p>
                    </div>
                  ) : (
                    sortedTasks.map((task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        isExpanded={expandedTaskId === task.id}
                        onToggleExpand={() =>
                          setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                        }
                        onToggleComplete={() => handleToggleComplete(task.id, task.isCompleted)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onUpdate={(data) => handleUpdateTask(task.id, data)}
                        categories={categories}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : activeTab === "notes" ? (
          <>
            {/* Notes Tab */}
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Notizen durchsuchen..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <AnimatePresence mode="wait">
              {!showAddNoteForm && !editingNoteId ? (
                <motion.button
                  key="add-note-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddNoteForm(true)}
                  className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Neue Notiz</span>
                </motion.button>
              ) : (
                <motion.form
                  key="add-note-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingNoteId) {
                      handleUpdateNote(editingNoteId, {
                        title: newNoteTitle.trim(),
                        content: newNoteContent || null,
                        color: newNoteColor,
                        remindAt: newNoteRemindAt ? new Date(newNoteRemindAt) : null,
                      });
                    } else {
                      handleAddNote(e);
                    }
                  }}
                  className={`border rounded-xl p-4 space-y-4 ${getNoteColorStyles(newNoteColor).bg} ${getNoteColorStyles(newNoteColor).border}`}
                >
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Titel der Notiz"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="flex-1 h-12 text-base bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (editingNoteId) {
                          cancelEditNote();
                        } else {
                          setShowAddNoteForm(false);
                        }
                      }}
                      className="h-12 w-12 shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <RichTextEditor
                    value={newNoteContent}
                    onChange={(_, text) => setNewNoteContent(text)}
                    placeholder="Notiz schreiben... (optional)"
                  />

                  {/* Color Picker */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Farbe
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NOTE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewNoteColor(color.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${color.bg} ${
                            newNoteColor === color.value
                              ? "ring-2 ring-primary ring-offset-2"
                              : "hover:scale-110"
                          } ${color.border}`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      value={newNoteRemindAt}
                      onChange={(e) => setNewNoteRemindAt(e.target.value)}
                      className="flex-1 h-10 bg-background/50"
                      placeholder="Erinnerung setzen"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!newNoteTitle.trim() || isSubmitting}
                    className="w-full h-10 bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? "Speichern..." : editingNoteId ? "Aktualisieren" : "Notiz erstellen"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredNotes.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <StickyNote className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-foreground font-medium">
                    {noteSearchQuery ? "Keine Treffer" : "Keine Notizen"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {noteSearchQuery
                      ? "Versuche andere Suchbegriffe"
                      : "Halte Gedanken und Erinnerungen fest"}
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const colorStyles = getNoteColorStyles(note.color);
                  return (
                    <motion.div
                      key={note.id}
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
                          onClick={() => startEditNote(note)}
                          className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Bearbeiten"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePinNote(note.id, note.isPinned)}
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
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        ) : activeTab === "lists" ? (
          <>
            {/* Lists Tab */}
            <div className="space-y-4">
              {/* Add List Button */}
              <AnimatePresence mode="wait">
                {!showAddListForm ? (
                  <motion.button
                    key="add-list-button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAddListForm(true)}
                    className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Neue Liste</span>
                  </motion.button>
                ) : (
                  <motion.form
                    key="add-list-form"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onSubmit={handleAddList}
                    className="bg-card border rounded-xl p-4 space-y-4"
                  >
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const icons = ["🛒", "📝", "🎁", "🏠", "💼", "🎯", "📚", "🍕"];
                          const current = icons.indexOf(newListIcon);
                          setNewListIcon(icons[(current + 1) % icons.length]);
                        }}
                        className="w-12 h-12 text-2xl bg-secondary rounded-lg hover:bg-accent transition-colors shrink-0 flex items-center justify-center"
                      >
                        {newListIcon}
                      </button>
                      <Input
                        autoFocus
                        placeholder="Name der Liste"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="flex-1 h-12 text-base"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowAddListForm(false);
                          setNewListName("");
                        }}
                        className="h-12 w-12 shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      disabled={!newListName.trim() || isSubmitting}
                      className="w-full h-10 bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? "Erstellen..." : "Liste erstellen"}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Lists Overview or Active List */}
              {!activeListId ? (
                /* All Lists */
                <div className="space-y-3">
                  {lists.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <p className="text-foreground font-medium">Keine Listen</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Erstelle deine erste Einkaufsliste!
                      </p>
                    </div>
                  ) : (
                    lists.map((list) => {
                      const checkedCount = list.items.filter((i) => i.isChecked).length;
                      const totalCount = list.items.length;
                      return (
                        <motion.button
                          key={list.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setActiveListId(list.id)}
                          className="w-full bg-card border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{list.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {list.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {totalCount === 0
                                  ? "Keine Einträge"
                                  : `${checkedCount}/${totalCount} erledigt`}
                              </p>
                            </div>
                            {totalCount > 0 && (
                              <div className="w-12 h-12 rounded-full border-4 border-secondary flex items-center justify-center relative">
                                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                                  <circle
                                    cx="18"
                                    cy="18"
                                    r="15"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-primary"
                                    strokeDasharray={`${(checkedCount / totalCount) * 94.2} 94.2`}
                                  />
                                </svg>
                                <span className="text-xs font-medium">
                                  {Math.round((checkedCount / totalCount) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Active List Detail */
                (() => {
                  const activeList = lists.find((l) => l.id === activeListId);
                  if (!activeList) return null;

                  const uncheckedItems = activeList.items.filter((i) => !i.isChecked);
                  const checkedItems = activeList.items.filter((i) => i.isChecked);

                  return (
                    <div className="space-y-4">
                      {/* List Header */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveListId(null)}
                          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronUp className="w-5 h-5 rotate-[-90deg]" />
                        </button>
                        <span className="text-2xl">{activeList.icon}</span>
                        <h2 className="text-lg font-semibold text-foreground flex-1">
                          {activeList.name}
                        </h2>
                        <button
                          onClick={() => handleDeleteList(activeList.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Add Item */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddItem(activeList.id);
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="Neuer Eintrag..."
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          className="flex-1 h-12 text-base"
                        />
                        <Button
                          type="submit"
                          disabled={!newItemText.trim()}
                          className="h-12 px-4 bg-primary hover:bg-primary/90"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </form>

                      {/* Unchecked Items */}
                      <div className="space-y-2">
                        {uncheckedItems.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 bg-card border rounded-xl p-4"
                          >
                            <button
                              onClick={() => handleToggleItem(activeList.id, item.id, item.isChecked)}
                              className="shrink-0"
                            >
                              <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                            </button>
                            <span className="flex-1 text-foreground">{item.text}</span>
                            <button
                              onClick={() => handleDeleteItem(activeList.id, item.id)}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      {/* Checked Items */}
                      {checkedItems.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Erledigt ({checkedItems.length})
                            </span>
                            <button
                              onClick={() => handleClearCheckedItems(activeList.id)}
                              className="text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                              Alle löschen
                            </button>
                          </div>
                          {checkedItems.map((item) => (
                            <motion.div
                              key={item.id}
                              layout
                              className="flex items-center gap-3 bg-card/50 border rounded-xl p-4 opacity-60"
                            >
                              <button
                                onClick={() => handleToggleItem(activeList.id, item.id, item.isChecked)}
                                className="shrink-0"
                              >
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              </button>
                              <span className="flex-1 text-muted-foreground line-through">
                                {item.text}
                              </span>
                              <button
                                onClick={() => handleDeleteItem(activeList.id, item.id)}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Empty State */}
                      {activeList.items.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Die Liste ist leer</p>
                          <p className="text-sm">Füge deinen ersten Eintrag hinzu!</p>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-muted-foreground">
          Mit Liebe gemacht für Miri
        </div>
      </footer>
    </div>
  );
}
