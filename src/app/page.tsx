"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LogIn,
  LogOut,
  Plus,
  Check,
  Clock,
  Sparkles,
  Filter,
  ChevronDown,
  Trash2,
  Edit3,
  X,
  Calendar,
  Circle,
  CheckCircle2,
} from "lucide-react";
import type { User as UserType, TaskWithCategory, Priority } from "@/lib/types";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  TIME_ESTIMATES,
  PRIORITIES,
} from "@/lib/types";
import type { Category } from "@/db/schema";

export default function Home() {
  const router = useRouter();
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

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      fuchsia: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      indigo: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      sky: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      teal: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      green: "bg-green-500/20 text-green-400 border-green-500/30",
      lime: "bg-lime-500/20 text-lime-400 border-lime-500/30",
      yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[color] || colors.blue;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Miri's Mindspace
            </h1>
            <p className="text-zinc-400 text-lg">
              Dein persönlicher Raum für Aufgaben und Gedanken
            </p>
          </div>

          <div className="space-y-3 text-sm text-zinc-500">
            <p>Endlich Überblick über deine To-Dos</p>
            <p>Thematisch gruppiert, priorisiert, mit Zeitschätzung</p>
          </div>

          <div className="flex gap-3 justify-center pt-4">
            <Link href="/login">
              <Button variant="outline" className="border-zinc-700">
                <LogIn className="w-4 h-4 mr-2" />
                Einloggen
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
                <Sparkles className="w-4 h-4 mr-2" />
                Los geht's
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Mindspace
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              {user.displayName || user.username}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center"
          >
            <div className="text-2xl font-bold text-white">{totalOpen}</div>
            <div className="text-xs text-zinc-500">Offen</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center"
          >
            <div className="text-2xl font-bold text-rose-400">
              {highPriorityCount}
            </div>
            <div className="text-xs text-zinc-500">Dringend</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center"
          >
            <div className="text-2xl font-bold text-violet-400">
              {totalEstimatedTime > 60
                ? `${Math.round(totalEstimatedTime / 60)}h`
                : `${totalEstimatedTime}m`}
            </div>
            <div className="text-xs text-zinc-500">Geschätzt</div>
          </motion.div>
        </div>

        {/* Add Task Button */}
        <AnimatePresence mode="wait">
          {!showAddForm ? (
            <motion.button
              key="add-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(true)}
              className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:border-violet-500/50 hover:text-violet-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Neue Aufgabe
            </motion.button>
          ) : (
            <motion.form
              key="add-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddTask}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4"
            >
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Was steht an?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-zinc-800/50 border-zinc-700"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                  className="text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Priority */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-zinc-500 w-full mb-1">
                  Priorität:
                </span>
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      newTaskPriority === p
                        ? PRIORITY_COLORS[p]
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>

              {/* Category */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-zinc-500 w-full mb-1">
                  Kategorie:
                </span>
                <button
                  type="button"
                  onClick={() => setNewTaskCategory(null)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    !newTaskCategory
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  Keine
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewTaskCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs transition-all border ${
                      newTaskCategory === cat.id
                        ? getCategoryColor(cat.color)
                        : "bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              {/* Time Estimate */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-zinc-500 w-full mb-1">
                  Zeitaufwand:
                </span>
                <button
                  type="button"
                  onClick={() => setNewTaskTime(null)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    !newTaskTime
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  -
                </button>
                {TIME_ESTIMATES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNewTaskTime(t.value)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      newTaskTime === t.value
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={!newTaskTitle.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
              >
                {isSubmitting ? "Speichern..." : "Hinzufügen"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                !filterCategory
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border ${
                  filterCategory === cat.id
                    ? getCategoryColor(cat.color)
                    : "bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              showCompleted
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <Check className="w-3 h-3 inline mr-1" />
            {showCompleted ? "Alle" : "Erledigte"}
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          <AnimatePresence>
            {sortedTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-zinc-500"
              >
                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>
                  {showCompleted
                    ? "Noch nichts erledigt"
                    : "Keine offenen Aufgaben"}
                </p>
                <p className="text-xs mt-1">Zeit zum Durchatmen!</p>
              </motion.div>
            ) : (
              sortedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 ${
                    task.isCompleted ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() =>
                        handleToggleComplete(task.id, task.isCompleted)
                      }
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 hover:text-violet-400 transition-colors" />
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
                          className="flex gap-2"
                        >
                          <Input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleUpdateTitle(task.id)}
                            className="bg-zinc-800 border-zinc-700 text-sm"
                          />
                        </form>
                      ) : (
                        <p
                          className={`text-sm ${
                            task.isCompleted
                              ? "line-through text-zinc-500"
                              : "text-white"
                          }`}
                        >
                          {task.title}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            PRIORITY_COLORS[task.priority as Priority]
                          }`}
                        >
                          {PRIORITY_LABELS[task.priority as Priority]}
                        </span>

                        {/* Category Badge */}
                        {task.category && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(
                              task.category.color
                            )}`}
                          >
                            {task.category.icon} {task.category.name}
                          </span>
                        )}

                        {/* Time Estimate */}
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes >= 60
                              ? `${Math.round(task.estimatedMinutes / 60)}h`
                              : `${task.estimatedMinutes}m`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingTask(task.id);
                          setEditTitle(task.title);
                        }}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
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
      <footer className="border-t border-zinc-800 py-4">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-zinc-600">
          Made with love for Miri
        </div>
      </footer>
    </div>
  );
}
