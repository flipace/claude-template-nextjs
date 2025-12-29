"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Circle } from "lucide-react";
import type { TaskWithCategory, Priority } from "@/lib/types";
import { formatTime } from "@/domains/shared";

interface TimePlannerProps {
  availableTime: number | null;
  setAvailableTime: (time: number | null) => void;
  tasks: TaskWithCategory[];
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
}

export function TimePlanner({
  availableTime,
  setAvailableTime,
  tasks,
  onToggleComplete,
}: TimePlannerProps) {
  const openTasks = tasks.filter((t) => !t.isCompleted);

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

  return (
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
                    onClick={() => onToggleComplete(task.id, task.isCompleted)}
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
  );
}
