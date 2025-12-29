import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, categories } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { taskFormSchema } from "@/lib/types";

// GET /api/tasks - Alle Aufgaben des Users abrufen
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const showCompleted = searchParams.get("completed") === "true";
  const categoryId = searchParams.get("categoryId");

  let conditions = [eq(tasks.userId, session.userId)];

  if (!showCompleted) {
    conditions.push(eq(tasks.isCompleted, false));
  }

  if (categoryId) {
    conditions.push(eq(tasks.categoryId, categoryId));
  }

  const userTasks = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      categoryId: tasks.categoryId,
      title: tasks.title,
      notes: tasks.notes,
      priority: tasks.priority,
      estimatedMinutes: tasks.estimatedMinutes,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      isCompleted: tasks.isCompleted,
      createdAt: tasks.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
        icon: categories.icon,
      },
    })
    .from(tasks)
    .leftJoin(categories, eq(tasks.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(tasks.sortOrder, desc(tasks.createdAt));

  return NextResponse.json({ tasks: userTasks });
}

// POST /api/tasks - Neue Aufgabe erstellen
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = taskFormSchema.parse(body);

    const id = crypto.randomUUID();

    await db.insert(tasks).values({
      id,
      userId: session.userId,
      title: validated.title,
      notes: validated.notes || null,
      categoryId: validated.categoryId || null,
      priority: validated.priority,
      estimatedMinutes: validated.estimatedMinutes || null,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
    });

    const [newTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 400 }
    );
  }
}
