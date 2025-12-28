import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password, inviteCode } = await request.json();

    const requiredInviteCode = process.env.INVITE_CODE;

    // If INVITE_CODE is set, require it
    if (requiredInviteCode) {
      if (!inviteCode) {
        return NextResponse.json(
          { error: "Invite code required" },
          { status: 400 }
        );
      }
      if (inviteCode !== requiredInviteCode) {
        return NextResponse.json(
          { error: "Invalid invite code" },
          { status: 403 }
        );
      }
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    // Check username length
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters" },
        { status: 400 }
      );
    }

    // Check password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if username exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Create user
    const id = `user_${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id,
      username,
      passwordHash,
    });

    // Create session
    await createSession(id);

    return NextResponse.json({
      user: { id, username },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}
