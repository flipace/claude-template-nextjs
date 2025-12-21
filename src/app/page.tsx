"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, LogOut, Settings, User } from "lucide-react";
import type { User as UserType } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold">My App</h1>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
            ) : user ? (
              <>
                <span className="text-sm text-zinc-400">
                  {user.displayName || user.username}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-zinc-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline" className="border-zinc-700">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Welcome to Your App</CardTitle>
              <CardDescription>
                This is a minimal Next.js starter template with authentication, SQLite database, and shadcn/ui components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Next.js 16</span>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">TypeScript</span>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">SQLite + Drizzle</span>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Tailwind CSS 4</span>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">shadcn/ui</span>
              </div>
            </CardContent>
          </Card>

          {/* Auth Status */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Auth Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-zinc-500">Loading...</p>
              ) : user ? (
                <div className="space-y-2">
                  <p className="text-sm text-emerald-400">Logged in as {user.username}</p>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <p>ID: {user.id}</p>
                    {user.displayName && <p>Display Name: {user.displayName}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">Not logged in</p>
                  <div className="flex gap-2">
                    <Link href="/login">
                      <Button size="sm" variant="outline" className="border-zinc-700">
                        Login
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Included Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li>Cookie-based authentication (bcrypt hashed passwords)</li>
                <li>SQLite database with Drizzle ORM (auto-migrations)</li>
                <li>File upload system (public/uploads)</li>
                <li>shadcn/ui component library</li>
                <li>Dark theme with Tailwind CSS 4</li>
                <li>React Hook Form + Zod validation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-zinc-600">
          Built with Next.js, Drizzle, and shadcn/ui
        </div>
      </footer>
    </div>
  );
}
