import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { taskFormSchema } from "@/lib/types";

// GET /api/tasks/[id] - Einzelne Aufgabe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.userId)));

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

// PATCH /api/tasks/[id] - Aufgabe aktualisieren
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

    // Check if task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, session.userId)));

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Handle toggle complete
    if (body.isCompleted !== undefined) {
      await db
        .update(tasks)
        .set({
          isCompleted: body.isCompleted,
          completedAt: body.isCompleted ? new Date() : null,
        })
        .where(eq(tasks.id, id));
    } else {
      // Full update
      const validated = taskFormSchema.partial().parse(body);

      await db
        .update(tasks)
        .set({
          ...validated,
          startDate: validated.startDate !== undefined
            ? (validated.startDate ? new Date(validated.startDate) : null)
            : existingTask.startDate,
          dueDate: validated.dueDate !== undefined
            ? (validated.dueDate ? new Date(validated.dueDate) : null)
            : existingTask.dueDate,
        })
        .where(eq(tasks.id, id));
    }

    const [updatedTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 400 }
    );
  }
}

// DELETE /api/tasks/[id] - Aufgabe löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if task exists and belongs to user
  const [existingTask] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.userId)));

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.delete(tasks).where(eq(tasks.id, id));

  return NextResponse.json({ success: true });
}
