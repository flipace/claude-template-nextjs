"use client";

import { useState, useCallback } from "react";
import type { Note } from "@/db/schema";
import type { ItemColor } from "@/domains/shared";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
    }
  }, []);

  const addNote = useCallback(async (data: {
    title: string;
    content?: string;
    color?: ItemColor;
    remindAt?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateNote = useCallback(async (noteId: string, data: Partial<Note>) => {
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
  }, []);

  const togglePin = useCallback(async (noteId: string, isPinned: boolean) => {
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !isPinned }),
    });
  }, []);

  return {
    notes,
    setNotes,
    isSubmitting,
    fetchNotes,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
  };
}
