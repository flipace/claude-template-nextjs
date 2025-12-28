import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, tasks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { categoryFormSchema } from "@/lib/types";

// PATCH /api/categories/[id] - Kategorie aktualisieren
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

    // Check if category exists and belongs to user
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, session.userId)));

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const validated = categoryFormSchema.partial().parse(body);

    await db
      .update(categories)
      .set(validated)
      .where(eq(categories.id, id));

    const [updatedCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 400 }
    );
  }
}

// DELETE /api/categories/[id] - Kategorie löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if category exists and belongs to user
  const [existingCategory] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, session.userId)));

  if (!existingCategory) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Set categoryId to null for all tasks in this category
  await db
    .update(tasks)
    .set({ categoryId: null })
    .where(eq(tasks.categoryId, id));

  await db.delete(categories).where(eq(categories.id, id));

  return NextResponse.json({ success: true });
}
