"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import {
  LogIn,
  LogOut,
  Check,
  Sun,
  Moon,
  ListTodo,
  Flame,
  Timer,
  Target,
  Zap,
  Calendar,
  StickyNote,
  Bell,
  Search,
  ShoppingCart,
} from "lucide-react";

// Domain imports
import { useAuth, formatTime, formatDate, getCategoryStyles, type ItemColor } from "@/domains/shared";
import { useTasks, SortableTask, AddTaskForm, AddTaskButton, TimePlanner } from "@/domains/tasks";
import { useNotes, NoteCard, AddNoteForm, AddNoteButton } from "@/domains/notes";
import { useLists, ListCard, ListDetail, AddListForm, AddListButton } from "@/domains/lists";

import type { Priority, TaskWithCategory } from "@/lib/types";
import type { Note } from "@/db/schema";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Domain hooks
  const {
    tasks,
    setTasks,
    categories,
    isSubmitting: isTaskSubmitting,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
  } = useTasks();

  const {
    notes,
    isSubmitting: isNoteSubmitting,
    fetchNotes,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
  } = useNotes();

  const {
    lists,
    isSubmitting: isListSubmitting,
    fetchLists,
    addList,
    deleteList,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    clearCheckedItems,
  } = useLists();

  // UI State
  const [activeTab, setActiveTab] = useState<"tasks" | "notes" | "lists">("tasks");
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Tasks UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [availableTime, setAvailableTime] = useState<number | null>(null);
  const [showTimePlanner, setShowTimePlanner] = useState(false);
  const [taskDateFilter, setTaskDateFilter] = useState<"all" | "today" | "week" | "overdue">("all");

  // Notes UI state
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState<ItemColor>("default");
  const [newNoteRemindAt, setNewNoteRemindAt] = useState("");

  // Lists UI state
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [showAddListForm, setShowAddListForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListIcon, setNewListIcon] = useState("🛒");
  const [newItemText, setNewItemText] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchTasks(showCompleted);
      fetchNotes();
      fetchLists();
    }
  }, [user, showCompleted, fetchTasks, fetchNotes, fetchLists]);

  // Refresh data helper
  const refreshData = useCallback(() => {
    fetchTasks(showCompleted);
    fetchNotes();
    fetchLists();
  }, [fetchTasks, fetchNotes, fetchLists, showCompleted]);

  // Task handlers
  const handleAddTask = async (data: { title: string; priority: Priority; categoryId?: string; estimatedMinutes?: number }) => {
    const success = await addTask(data);
    if (success) refreshData();
    return success;
  };

  const handleUpdateTask = async (taskId: string, data: Partial<TaskWithCategory>) => {
    await updateTask(taskId, data);
    refreshData();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    refreshData();
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    await toggleComplete(taskId, isCompleted);
    refreshData();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
      setTasks(newOrder);
      await reorderTasks(newOrder.map((t) => t.id));
    }
  };

  // Note handlers
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const success = await addNote({
      title: newNoteTitle.trim(),
      content: newNoteContent || undefined,
      color: newNoteColor,
      remindAt: newNoteRemindAt || undefined,
    });

    if (success) {
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteColor("default");
      setNewNoteRemindAt("");
      setShowAddNoteForm(false);
      refreshData();
    }
  };

  const handleUpdateNote = async (noteId: string, data: Partial<Note>) => {
    await updateNote(noteId, data);
    setEditingNoteId(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteColor("default");
    setNewNoteRemindAt("");
    refreshData();
  };

  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content || "");
    setNewNoteColor((note.color as ItemColor) || "default");
    setNewNoteRemindAt(note.remindAt ? new Date(note.remindAt).toISOString().slice(0, 16) : "");
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteColor("default");
    setNewNoteRemindAt("");
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    refreshData();
  };

  const handleTogglePinNote = async (noteId: string, isPinned: boolean) => {
    await togglePin(noteId, isPinned);
    refreshData();
  };

  // List handlers
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList = await addList({ name: newListName.trim(), icon: newListIcon });
    if (newList) {
      setNewListName("");
      setNewListIcon("🛒");
      setShowAddListForm(false);
      setActiveListId(newList.id);
      refreshData();
    }
  };

  const handleDeleteList = async (listId: string) => {
    await deleteList(listId);
    if (activeListId === listId) setActiveListId(null);
    refreshData();
  };

  const handleAddItem = async (listId: string) => {
    if (!newItemText.trim()) return;
    const success = await addItem(listId, newItemText.trim(), newItemDueDate || undefined);
    if (success) {
      setNewItemText("");
      setNewItemDueDate("");
      refreshData();
    }
  };

  const handleUpdateItem = async (listId: string, itemId: string, data: { dueDate?: string | null }) => {
    await updateItem(listId, itemId, data);
    refreshData();
  };

  const handleToggleItem = async (listId: string, itemId: string, isChecked: boolean) => {
    await toggleItem(listId, itemId, isChecked);
    refreshData();
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    await deleteItem(listId, itemId);
    refreshData();
  };

  const handleClearCheckedItems = async (listId: string) => {
    await clearCheckedItems(listId);
    refreshData();
  };

  // Computed values - apply both category and date filters
  const dateFilteredTasks = useMemo(() => {
    if (taskDateFilter === "all") return tasks;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return tasks.filter((task) => {
      // Use dueDate or startDate for filtering
      const taskDate = task.dueDate || task.startDate;
      if (!taskDate) return false; // Tasks without dates don't show in filtered views

      const date = new Date(taskDate);
      const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      switch (taskDateFilter) {
        case "today":
          return taskDay.getTime() === today.getTime();
        case "week":
          return taskDay >= today && taskDay <= weekEnd;
        case "overdue":
          return taskDay < today;
        default:
          return true;
      }
    });
  }, [tasks, taskDateFilter]);

  const filteredTasks = filterCategory ? dateFilteredTasks.filter((t) => t.categoryId === filterCategory) : dateFilteredTasks;
  const sortedTasks = [...filteredTasks];
  const openTasks = tasks.filter((t) => !t.isCompleted);
  const totalOpen = openTasks.length;
  const highPriorityCount = openTasks.filter((t) => t.priority === "high").length;
  const totalEstimatedTime = openTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  const upcomingReminders = notes.filter((n) => {
    if (!n.remindAt) return false;
    const remindDate = new Date(n.remindAt);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return remindDate >= now && remindDate <= tomorrow;
  });

  const filteredNotes = useMemo(() => {
    if (!noteSearchQuery.trim()) return notes;
    const query = noteSearchQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(query) || (n.content && n.content.toLowerCase().includes(query))
    );
  }, [notes, noteSearchQuery]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

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
            <h1 className="text-3xl font-bold text-foreground">Miri's Mindspace</h1>
            <p className="text-muted-foreground">Dein persönlicher Raum für Aufgaben und Gedanken</p>
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

  const activeList = lists.find((l) => l.id === activeListId);

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
            <Button size="sm" variant="ghost" onClick={logout} className="text-muted-foreground hover:text-foreground">
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
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Erinnerungen</span>
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
              activeTab === "tasks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Aufgaben
            {totalOpen > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">{totalOpen}</span>}
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "notes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <StickyNote className="w-4 h-4" />
            Notizen
            {notes.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">{notes.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab("lists")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "lists" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Listen
            {lists.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-xs">{lists.length}</span>}
          </button>
        </div>

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Hallo {user.displayName || user.username}!</p>
              <button
                onClick={() => setShowTimePlanner(!showTimePlanner)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  showTimePlanner || availableTime ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Zeitplanung
              </button>
            </div>

            <AnimatePresence>
              {showTimePlanner && (
                <TimePlanner
                  availableTime={availableTime}
                  setAvailableTime={setAvailableTime}
                  tasks={tasks}
                  onToggleComplete={handleToggleComplete}
                />
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
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{highPriorityCount}</div>
                <div className="text-xs text-muted-foreground">Dringend</div>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatTime(totalEstimatedTime)}</div>
                <div className="text-xs text-muted-foreground">Aufwand</div>
              </div>
            </div>

            {/* Add Task */}
            <AnimatePresence mode="wait">
              {!showAddForm ? (
                <AddTaskButton key="add-button" onClick={() => setShowAddForm(true)} />
              ) : (
                <AddTaskForm
                  key="add-form"
                  isDark={isDark}
                  categories={categories}
                  isSubmitting={isTaskSubmitting}
                  onSubmit={handleAddTask}
                  onClose={() => setShowAddForm(false)}
                />
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Deine Aufgaben</h2>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  showCompleted ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-secondary text-muted-foreground hover:text-foreground"
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
                    !filterCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Alle
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border shrink-0 ${
                      filterCategory === cat.id ? getCategoryStyles(cat.color, isDark) : "bg-secondary text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Date Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {(["all", "today", "week", "overdue"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskDateFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                    taskDateFilter === filter
                      ? filter === "overdue"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {filter === "all" && "Alle Termine"}
                  {filter === "today" && "Heute"}
                  {filter === "week" && "Diese Woche"}
                  {filter === "overdue" && "Überfällig"}
                </button>
              ))}
            </div>

            {/* Task List with DnD */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {sortedTasks.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-foreground font-medium">
                        {taskDateFilter !== "all"
                          ? `Keine Aufgaben ${taskDateFilter === "today" ? "für heute" : taskDateFilter === "week" ? "diese Woche" : "überfällig"}`
                          : showCompleted ? "Keine erledigten Aufgaben" : "Keine offenen Aufgaben"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {taskDateFilter !== "all" ? (
                          <button onClick={() => setTaskDateFilter("all")} className="text-primary hover:underline">
                            Alle anzeigen
                          </button>
                        ) : showCompleted ? "Fang an abzuhaken!" : "Zeit zum Durchatmen!"}
                      </p>
                    </div>
                  ) : (
                    sortedTasks.map((task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        isExpanded={expandedTaskId === task.id}
                        onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
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
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <>
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
                <AddNoteButton key="add-note-button" onClick={() => setShowAddNoteForm(true)} />
              ) : (
                <AddNoteForm
                  key="add-note-form"
                  title={newNoteTitle}
                  setTitle={setNewNoteTitle}
                  content={newNoteContent}
                  setContent={setNewNoteContent}
                  color={newNoteColor}
                  setColor={setNewNoteColor}
                  remindAt={newNoteRemindAt}
                  setRemindAt={setNewNoteRemindAt}
                  isEditing={!!editingNoteId}
                  isSubmitting={isNoteSubmitting}
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
                  onCancel={() => {
                    if (editingNoteId) cancelEditNote();
                    else setShowAddNoteForm(false);
                  }}
                />
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredNotes.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <StickyNote className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-foreground font-medium">{noteSearchQuery ? "Keine Treffer" : "Keine Notizen"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {noteSearchQuery ? "Versuche andere Suchbegriffe" : "Halte Gedanken und Erinnerungen fest"}
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => startEditNote(note)}
                    onTogglePin={() => handleTogglePinNote(note.id, note.isPinned)}
                    onDelete={() => handleDeleteNote(note.id)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Lists Tab */}
        {activeTab === "lists" && (
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!showAddListForm ? (
                <AddListButton key="add-list-button" onClick={() => setShowAddListForm(true)} />
              ) : (
                <AddListForm
                  key="add-list-form"
                  name={newListName}
                  setName={setNewListName}
                  icon={newListIcon}
                  setIcon={setNewListIcon}
                  isSubmitting={isListSubmitting}
                  onSubmit={handleAddList}
                  onCancel={() => {
                    setShowAddListForm(false);
                    setNewListName("");
                  }}
                />
              )}
            </AnimatePresence>

            {!activeListId ? (
              <div className="space-y-3">
                {lists.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <p className="text-foreground font-medium">Keine Listen</p>
                    <p className="text-sm text-muted-foreground mt-1">Erstelle deine erste Einkaufsliste!</p>
                  </div>
                ) : (
                  lists.map((list) => <ListCard key={list.id} list={list} onClick={() => setActiveListId(list.id)} />)
                )}
              </div>
            ) : activeList ? (
              <ListDetail
                list={activeList}
                newItemText={newItemText}
                setNewItemText={setNewItemText}
                newItemDueDate={newItemDueDate}
                setNewItemDueDate={setNewItemDueDate}
                onBack={() => setActiveListId(null)}
                onAddItem={() => handleAddItem(activeList.id)}
                onToggleItem={(itemId, isChecked) => handleToggleItem(activeList.id, itemId, isChecked)}
                onUpdateItem={(itemId, data) => handleUpdateItem(activeList.id, itemId, data)}
                onDeleteItem={(itemId) => handleDeleteItem(activeList.id, itemId)}
                onClearChecked={() => handleClearCheckedItems(activeList.id)}
                onDeleteList={() => handleDeleteList(activeList.id)}
              />
            ) : null}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-muted-foreground">
          made by{" "}
          <a href="https://neschkudla.at" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            @flipace
          </a>
          {" "}und Claude Code
        </div>
      </footer>
    </div>
  );
}
