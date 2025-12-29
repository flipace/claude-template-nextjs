import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const itemUpdateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  isChecked: z.boolean().optional(),
  dueDate: z.string().nullable().optional(), // ISO date string or null to clear
});

// PATCH /api/lists/[id]/items/[itemId] - Update item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listId, itemId } = await params;

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
    const validated = itemUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (validated.text !== undefined) updateData.text = validated.text;
    if (validated.isChecked !== undefined) updateData.isChecked = validated.isChecked;
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }

    await db
      .update(listItems)
      .set(updateData)
      .where(and(eq(listItems.id, itemId), eq(listItems.listId, listId)));

    const [updatedItem] = await db
      .select()
      .from(listItems)
      .where(eq(listItems.id, itemId));

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 400 }
    );
  }
}

// DELETE /api/lists/[id]/items/[itemId] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listId, itemId } = await params;

  // Verify list belongs to user
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, session.userId)));

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  await db
    .delete(listItems)
    .where(and(eq(listItems.id, itemId), eq(listItems.listId, listId)));

  return NextResponse.json({ success: true });
}
