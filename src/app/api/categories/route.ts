import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import { categoryFormSchema } from "@/lib/types";

// Standard-Kategorien die beim ersten Login erstellt werden
const DEFAULT_CATEGORIES = [
  { name: "Arbeit", color: "blue", icon: "💼" },
  { name: "Privat", color: "purple", icon: "🏠" },
  { name: "Haushalt", color: "emerald", icon: "🧹" },
  { name: "Gesundheit", color: "rose", icon: "💪" },
  { name: "Finanzen", color: "amber", icon: "💰" },
  { name: "Soziales", color: "pink", icon: "👥" },
];

// GET /api/categories - Alle Kategorien des Users abrufen
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, session.userId))
    .orderBy(asc(categories.sortOrder));

  // Wenn keine Kategorien existieren, erstelle die Standard-Kategorien
  if (userCategories.length === 0) {
    const categoriesToInsert = DEFAULT_CATEGORIES.map((cat, index) => ({
      id: crypto.randomUUID(),
      userId: session.userId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      sortOrder: index,
    }));

    await db.insert(categories).values(categoriesToInsert);

    userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, session.userId))
      .orderBy(asc(categories.sortOrder));
  }

  return NextResponse.json({ categories: userCategories });
}

// POST /api/categories - Neue Kategorie erstellen
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = categoryFormSchema.parse(body);

    // Get max sort order
    const existingCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, session.userId));

    const maxSortOrder = Math.max(
      0,
      ...existingCategories.map((c) => c.sortOrder)
    );

    const id = crypto.randomUUID();

    await db.insert(categories).values({
      id,
      userId: session.userId,
      name: validated.name,
      color: validated.color,
      icon: validated.icon || null,
      sortOrder: maxSortOrder + 1,
    });

    const [newCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 400 }
    );
  }
}
