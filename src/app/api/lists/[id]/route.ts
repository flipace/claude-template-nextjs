import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const LIST_COLORS = ["default", "red", "orange", "yellow", "green", "blue", "purple", "pink"] as const;

const listUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  color: z.enum(LIST_COLORS).optional(),
});

// GET /api/lists/[id] - Get single list with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, id), eq(lists.userId, session.userId)));

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, id))
    .orderBy(asc(listItems.sortOrder), asc(listItems.createdAt));

  return NextResponse.json({ list: { ...list, items } });
}

// PATCH /api/lists/[id] - Update list
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
    const validated = listUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.icon !== undefined) updateData.icon = validated.icon;
    if (validated.color !== undefined) updateData.color = validated.color;

    await db
      .update(lists)
      .set(updateData)
      .where(and(eq(lists.id, id), eq(lists.userId, session.userId)));

    const [updatedList] = await db
      .select()
      .from(lists)
      .where(eq(lists.id, id));

    const items = await db
      .select()
      .from(listItems)
      .where(eq(listItems.listId, id))
      .orderBy(asc(listItems.sortOrder), asc(listItems.createdAt));

    return NextResponse.json({ list: { ...updatedList, items } });
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 400 }
    );
  }
}

// DELETE /api/lists/[id] - Delete list and all its items
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Delete all items first
  await db
    .delete(listItems)
    .where(eq(listItems.listId, id));

  // Then delete the list
  await db
    .delete(lists)
    .where(and(eq(lists.id, id), eq(lists.userId, session.userId)));

  return NextResponse.json({ success: true });
}
