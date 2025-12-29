import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// POST /api/tasks/reorder - Reihenfolge der Aufgaben aktualisieren
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taskIds } = await request.json();

    if (!Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: "taskIds must be an array" },
        { status: 400 }
      );
    }

    // Update sort order for each task
    await Promise.all(
      taskIds.map((taskId: string, index: number) =>
        db
          .update(tasks)
          .set({ sortOrder: index })
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.userId)))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}
