import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const noteUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  remindAt: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
});

// GET /api/notes/[id] - Einzelne Notiz abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, session.userId)));

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ note });
}

// PATCH /api/notes/[id] - Notiz aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = noteUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.content !== undefined) updateData.content = validated.content;
    if (validated.remindAt !== undefined) {
      updateData.remindAt = validated.remindAt ? new Date(validated.remindAt) : null;
    }
    if (validated.isPinned !== undefined) updateData.isPinned = validated.isPinned;

    await db
      .update(notes)
      .set(updateData)
      .where(and(eq(notes.id, id), eq(notes.userId, session.userId)));

    const [updatedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id));

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 400 }
    );
  }
}

// DELETE /api/notes/[id] - Notiz löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, session.userId)));

  return NextResponse.json({ success: true });
}
