import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const LIST_COLORS = ["default", "red", "orange", "yellow", "green", "blue", "purple", "pink"] as const;

const listFormSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: z.enum(LIST_COLORS).optional(),
});

// GET /api/lists - Get all lists with their items
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLists = await db
    .select()
    .from(lists)
    .where(eq(lists.userId, session.userId))
    .orderBy(asc(lists.sortOrder), asc(lists.createdAt));

  // Get items for each list
  const listsWithItems = await Promise.all(
    userLists.map(async (list) => {
      const items = await db
        .select()
        .from(listItems)
        .where(eq(listItems.listId, list.id))
        .orderBy(asc(listItems.sortOrder), asc(listItems.createdAt));
      return { ...list, items };
    })
  );

  return NextResponse.json({ lists: listsWithItems });
}

// POST /api/lists - Create a new list
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = listFormSchema.parse(body);

    const id = crypto.randomUUID();

    await db.insert(lists).values({
      id,
      userId: session.userId,
      name: validated.name,
      icon: validated.icon || "🛒",
      color: validated.color || "default",
    });

    const [newList] = await db
      .select()
      .from(lists)
      .where(eq(lists.id, id));

    return NextResponse.json({ list: { ...newList, items: [] } }, { status: 201 });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json(
      { error: "Failed to create list" },
      { status: 400 }
    );
  }
}
