"use client";

import { useState, useCallback } from "react";
import type { TaskWithCategory, Priority } from "@/lib/types";
import type { Category } from "@/db/schema";

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async (showCompleted: boolean) => {
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
  }, []);

  const addTask = useCallback(async (data: {
    title: string;
    priority: Priority;
    categoryId?: string;
    estimatedMinutes?: number;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, data: Partial<TaskWithCategory>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }, []);

  const toggleComplete = useCallback(async (taskId: string, isCompleted: boolean) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !isCompleted }),
    });
  }, []);

  const reorderTasks = useCallback(async (taskIds: string[]) => {
    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds }),
    });
  }, []);

  return {
    tasks,
    setTasks,
    categories,
    isSubmitting,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
  };
}
