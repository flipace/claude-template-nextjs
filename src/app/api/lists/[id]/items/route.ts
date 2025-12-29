import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const itemFormSchema = z.object({
  text: z.string().min(1).max(500),
});

// GET /api/lists/[id]/items - Get all items for a list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listId } = await params;

  // Verify list belongs to user
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, session.userId)));

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, listId))
    .orderBy(asc(listItems.sortOrder), asc(listItems.createdAt));

  return NextResponse.json({ items });
}

// POST /api/lists/[id]/items - Add item to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listId } = await params;

  // Verify list belongs to user
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, session.userId)));

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validated = itemFormSchema.parse(body);

    const id = crypto.randomUUID();

    // Get max sort order
    const existingItems = await db
      .select()
      .from(listItems)
      .where(eq(listItems.listId, listId));

    const maxSortOrder = existingItems.reduce((max, item) =>
      Math.max(max, item.sortOrder), -1);

    await db.insert(listItems).values({
      id,
      listId,
      userId: session.userId,
      text: validated.text,
      sortOrder: maxSortOrder + 1,
    });

    const [newItem] = await db
      .select()
      .from(listItems)
      .where(eq(listItems.id, id));

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating list item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 400 }
    );
  }
}

// DELETE /api/lists/[id]/items - Clear all checked items
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listId } = await params;

  // Verify list belongs to user
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, session.userId)));

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  // Delete all checked items
  await db
    .delete(listItems)
    .where(and(
      eq(listItems.listId, listId),
      eq(listItems.isChecked, true)
    ));

  return NextResponse.json({ success: true });
}
