"use client";

import { useState, useCallback } from "react";
import type { List, ListItem } from "@/db/schema";

export type ListWithItems = List & { items: ListItem[] };

export function useLists() {
  const [lists, setLists] = useState<ListWithItems[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLists = useCallback(async () => {
    const res = await fetch("/api/lists");
    if (res.ok) {
      const data = await res.json();
      setLists(data.lists);
    }
  }, []);

  const addList = useCallback(async (data: { name: string; icon?: string }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        return result.list;
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateList = useCallback(async (listId: string, data: { name?: string; icon?: string }) => {
    await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, []);

  const deleteList = useCallback(async (listId: string) => {
    await fetch(`/api/lists/${listId}`, { method: "DELETE" });
  }, []);

  const addItem = useCallback(async (listId: string, text: string) => {
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  }, []);

  const toggleItem = useCallback(async (listId: string, itemId: string, isChecked: boolean) => {
    await fetch(`/api/lists/${listId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked: !isChecked }),
    });
  }, []);

  const deleteItem = useCallback(async (listId: string, itemId: string) => {
    await fetch(`/api/lists/${listId}/items/${itemId}`, { method: "DELETE" });
  }, []);

  const clearCheckedItems = useCallback(async (listId: string) => {
    await fetch(`/api/lists/${listId}/items`, { method: "DELETE" });
  }, []);

  return {
    lists,
    setLists,
    isSubmitting,
    fetchLists,
    addList,
    updateList,
    deleteList,
    addItem,
    toggleItem,
    deleteItem,
    clearCheckedItems,
  };
}
