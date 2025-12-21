import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "session";
const SESSION_SECRET = process.env.SESSION_SECRET || "appapp-secret-change-in-prod";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Simple session token: base64(userId:timestamp:signature)
function createSessionToken(userId: string): string {
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}`;
  // Simple HMAC-like signature using the secret
  const signature = Buffer.from(`${data}:${SESSION_SECRET}`).toString("base64").slice(0, 16);
  return Buffer.from(`${data}:${signature}`).toString("base64");
}

function parseSessionToken(token: string): { userId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const [userId, timestampStr, signature] = decoded.split(":");
    const timestamp = parseInt(timestampStr, 10);

    // Verify signature
    const expectedSignature = Buffer.from(`${userId}:${timestamp}:${SESSION_SECRET}`).toString("base64").slice(0, 16);
    if (signature !== expectedSignature) {
      return null;
    }

    // Check if session is older than 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > thirtyDays) {
      return null;
    }

    return { userId, timestamp };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = parseSessionToken(token);
  return session ? { userId: session.userId } : null;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const user = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user[0] || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
