"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Filter,
} from "lucide-react";
import type { ListWithItems } from "../hooks/useLists";
import { formatDate } from "@/domains/shared";

type DateFilter = "all" | "today" | "week" | "older";

interface ListDetailProps {
  list: ListWithItems;
  newItemText: string;
  setNewItemText: (text: string) => void;
  onBack: () => void;
  onAddItem: () => void;
  onToggleItem: (itemId: string, isChecked: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onClearChecked: () => void;
  onDeleteList: () => void;
}

export function ListDetail({
  list,
  newItemText,
  setNewItemText,
  onBack,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onClearChecked,
  onDeleteList,
}: ListDetailProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filterItemsByDate = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return (items: typeof list.items) => {
      if (dateFilter === "all") return items;

      return items.filter((item) => {
        const itemDate = new Date(item.createdAt);
        const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

        switch (dateFilter) {
          case "today":
            return itemDay.getTime() === today.getTime();
          case "week":
            return itemDay >= weekAgo;
          case "older":
            return itemDay < weekAgo;
          default:
            return true;
        }
      });
    };
  }, [dateFilter]);

  const uncheckedItems = filterItemsByDate(list.items.filter((i) => !i.isChecked));
  const checkedItems = filterItemsByDate(list.items.filter((i) => i.isChecked));

  const filterLabels: Record<DateFilter, string> = {
    all: "Alle",
    today: "Heute",
    week: "Diese Woche",
    older: "Älter",
  };

  return (
    <div className="space-y-4">
      {/* List Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-2xl">{list.icon}</span>
        <h2 className="text-lg font-semibold text-foreground flex-1">
          {list.name}
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            dateFilter !== "all"
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Filter"
        >
          <Filter className="w-4 h-4" />
        </button>
        <button
          onClick={onDeleteList}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Date Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2 pb-2 border-b"
        >
          {(Object.keys(filterLabels) as DateFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                dateFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter !== "all" && <Calendar className="w-3 h-3" />}
              {filterLabels[filter]}
            </button>
          ))}
        </motion.div>
      )}

      {/* Add Item */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddItem();
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
              onClick={() => onToggleItem(item.id, item.isChecked)}
              className="shrink-0"
            >
              <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-foreground">{item.text}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {formatDate(item.createdAt)}
              </span>
            </div>
            <button
              onClick={() => onDeleteItem(item.id)}
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
              onClick={onClearChecked}
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
                onClick={() => onToggleItem(item.id, item.isChecked)}
                className="shrink-0"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground line-through">{item.text}</span>
                <span className="block text-xs text-muted-foreground/60 mt-0.5">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {list.items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Die Liste ist leer</p>
          <p className="text-sm">Füge deinen ersten Eintrag hinzu!</p>
        </div>
      )}

      {/* Filtered Empty State */}
      {list.items.length > 0 && uncheckedItems.length === 0 && checkedItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Keine Einträge für diesen Filter</p>
          <button
            onClick={() => setDateFilter("all")}
            className="text-sm text-primary hover:underline mt-2"
          >
            Alle anzeigen
          </button>
        </div>
      )}
    </div>
  );
}
