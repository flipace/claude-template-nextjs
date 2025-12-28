import { db } from "@/db";
import { users, tasks, categories } from "@/db/schema";
import { getCurrentUser, clearSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all user's tasks and categories first
    await db.delete(tasks).where(eq(tasks.userId, user.id));
    await db.delete(categories).where(eq(categories.userId, user.id));

    // Delete the user
    await db.delete(users).where(eq(users.id, user.id));

    // Clear the session
    await clearSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
