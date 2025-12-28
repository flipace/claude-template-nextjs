"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import {
  LogIn,
  LogOut,
  Plus,
  Check,
  Clock,
  Sparkles,
  Trash2,
  Edit3,
  X,
  Circle,
  CheckCircle2,
  Sun,
  Moon,
  ListTodo,
  Flame,
  Timer,
} from "lucide-react";
import type { User as UserType, TaskWithCategory, Priority } from "@/lib/types";
import {
  PRIORITY_LABELS,
  TIME_ESTIMATES,
  PRIORITIES,
} from "@/lib/types";
import type { Category } from "@/db/schema";

// Theme-aware priority colors
const getPriorityStyles = (priority: Priority, isDark: boolean) => {
  const styles = {
    low: isDark
      ? "bg-slate-500/20 text-slate-300 border-slate-500/30"
      : "bg-slate-100 text-slate-600 border-slate-200",
    medium: isDark
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-amber-50 text-amber-700 border-amber-200",
    high: isDark
      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
      : "bg-rose-50 text-rose-600 border-rose-200",
  };
  return styles[priority];
};

// Theme-aware category colors
const getCategoryStyles = (color: string, isDark: boolean) => {
  const darkColors: Record<string, string> = {
    rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    pink: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    fuchsia: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    violet: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    sky: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    teal: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
    lime: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
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
  return colors[color] || colors.blue;
};

export default function Home() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [newTaskCategory, setNewTaskCategory] = useState<string | null>(null);
  const [newTaskTime, setNewTaskTime] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

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

  // Fetch tasks and categories
  const fetchData = useCallback(async () => {
    if (!user) return;

    const [tasksRes, categoriesRes] = await Promise.all([
      fetch(`/api/tasks?completed=${showCompleted}`),
      fetch("/api/categories"),
    ]);

    if (tasksRes.ok) {
      const data = await tasksRes.json();
      setTasks(data.tasks);
    }

    if (categoriesRes.ok) {
      const data = await categoriesRes.json();
      setCategories(data.categories);
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

  const handleUpdateTitle = async (taskId: string) => {
    if (!editTitle.trim()) {
      setEditingTask(null);
      return;
    }

    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim() }),
    });

    setEditingTask(null);
    fetchData();
  };

  // Filter tasks
  const filteredTasks = filterCategory
    ? tasks.filter((t) => t.categoryId === filterCategory)
    : tasks;

  // Sort by priority (high first) then by creation date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority as Priority] ?? 1;
    const bPriority = priorityOrder[b.priority as Priority] ?? 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Stats
  const totalOpen = tasks.filter((t) => !t.isCompleted).length;
  const highPriorityCount = tasks.filter(
    (t) => !t.isCompleted && t.priority === "high"
  ).length;
  const totalEstimatedTime = tasks
    .filter((t) => !t.isCompleted)
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
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
          {/* Logo */}
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Miri's Mindspace
            </h1>
            <p className="text-muted-foreground">
              Dein persönlicher Raum für Aufgaben und Gedanken
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Überblick behalten</p>
                <p className="text-xs text-muted-foreground">Alle Aufgaben auf einen Blick</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Priorisieren</p>
                <p className="text-xs text-muted-foreground">Was ist wirklich wichtig?</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Zeit einschätzen</p>
                <p className="text-xs text-muted-foreground">Realistisch planen</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Link href="/signup" className="block">
              <Button className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg">
                <Sparkles className="w-5 h-5 mr-2" />
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

          {/* Theme Toggle */}
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
          <h1 className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
            Mindspace
          </h1>
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
        {/* Welcome Message */}
        <div className="text-center sm:text-left">
          <p className="text-muted-foreground text-sm">
            Hallo {user.displayName || user.username}! Was steht heute an?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                <ListTodo className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{totalOpen}</div>
            <div className="text-xs text-muted-foreground">Offene Aufgaben</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {highPriorityCount}
            </div>
            <div className="text-xs text-muted-foreground">Dringend</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalEstimatedTime > 60
                ? `${Math.round(totalEstimatedTime / 60)}h`
                : `${totalEstimatedTime}m`}
            </div>
            <div className="text-xs text-muted-foreground">Zeitaufwand</div>
          </motion.div>
        </div>

        {/* Add Task Section */}
        <AnimatePresence mode="wait">
          {!showAddForm ? (
            <motion.button
              key="add-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(true)}
              className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Neue Aufgabe hinzufügen</span>
            </motion.button>
          ) : (
            <motion.form
              key="add-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleAddTask}
              className="bg-card border rounded-xl p-4 space-y-5"
            >
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Was möchtest du erledigen?
                </label>
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder="z.B. Arzttermin ausmachen"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 h-12 text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddForm(false)}
                    className="h-12 w-12 text-muted-foreground shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Wie wichtig ist es?
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        newTaskPriority === p
                          ? getPriorityStyles(p, isDark)
                          : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Zu welchem Bereich gehört es?
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTaskCategory(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      !newTaskCategory
                        ? "bg-foreground text-background border-transparent"
                        : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                    }`}
                  >
                    Keiner
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewTaskCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        newTaskCategory === cat.id
                          ? getCategoryStyles(cat.color, isDark)
                          : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Estimate */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Wie lange wird es dauern?
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTaskTime(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      !newTaskTime
                        ? "bg-foreground text-background border-transparent"
                        : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                    }`}
                  >
                    Egal
                  </button>
                  {TIME_ESTIMATES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setNewTaskTime(t.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        newTaskTime === t.value
                          ? "bg-violet-600 text-white border-transparent"
                          : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!newTaskTitle.trim() || isSubmitting}
                className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
              >
                {isSubmitting ? "Wird gespeichert..." : "Aufgabe hinzufügen"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Filter Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Deine Aufgaben</h2>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                showCompleted
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Check className="w-4 h-4" />
              {showCompleted ? "Alle anzeigen" : "Erledigte zeigen"}
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all shrink-0 ${
                !filterCategory
                  ? "bg-violet-600 text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Alle
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setFilterCategory(filterCategory === cat.id ? null : cat.id)
                }
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
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-foreground font-medium">
                  {showCompleted
                    ? "Noch keine erledigten Aufgaben"
                    : "Keine offenen Aufgaben"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {showCompleted
                    ? "Fang an, Aufgaben abzuhaken!"
                    : "Zeit zum Durchatmen!"}
                </p>
              </motion.div>
            ) : (
              sortedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.02 }}
                  className={`bg-card border rounded-xl p-4 ${
                    task.isCompleted ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() =>
                        handleToggleComplete(task.id, task.isCompleted)
                      }
                      className="mt-0.5 shrink-0 touch-manipulation"
                      aria-label={task.isCompleted ? "Als offen markieren" : "Als erledigt markieren"}
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-violet-500 transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {editingTask === task.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateTitle(task.id);
                          }}
                        >
                          <Input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleUpdateTitle(task.id)}
                            className="text-base"
                          />
                        </form>
                      ) : (
                        <p
                          className={`text-base ${
                            task.isCompleted
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </p>
                      )}

                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Priority */}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityStyles(
                            task.priority as Priority,
                            isDark
                          )}`}
                        >
                          {PRIORITY_LABELS[task.priority as Priority]}
                        </span>

                        {/* Category */}
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

                        {/* Time */}
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes >= 60
                              ? `${Math.round(task.estimatedMinutes / 60)} Std`
                              : `${task.estimatedMinutes} Min`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions - Always visible on mobile */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingTask(task.id);
                          setEditTitle(task.title);
                        }}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                        aria-label="Bearbeiten"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors touch-manipulation"
                        aria-label="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
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
