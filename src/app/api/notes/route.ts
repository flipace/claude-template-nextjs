import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const NOTE_COLORS = ["default", "red", "orange", "yellow", "green", "blue", "purple", "pink"] as const;

const noteFormSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  color: z.enum(NOTE_COLORS).optional(),
  remindAt: z.string().optional(), // ISO date string
  isPinned: z.boolean().optional(),
});

// GET /api/notes - Alle Notizen des Users abrufen
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, session.userId))
    .orderBy(desc(notes.isPinned), desc(notes.createdAt));

  return NextResponse.json({ notes: userNotes });
}

// POST /api/notes - Neue Notiz erstellen
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = noteFormSchema.parse(body);

    const id = crypto.randomUUID();

    await db.insert(notes).values({
      id,
      userId: session.userId,
      title: validated.title,
      content: validated.content || null,
      color: validated.color || "default",
      remindAt: validated.remindAt ? new Date(validated.remindAt) : null,
      isPinned: validated.isPinned || false,
    });

    const [newNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id));

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 400 }
    );
  }
}
