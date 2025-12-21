# Claude Code Instructions

## First Steps for New Project

When starting a new project from this template, update these files first:

1. **This file (`CLAUDE.md`)** - Update project overview, add domain-specific patterns
2. **`src/app/layout.tsx`** - Change title, description, app name
3. **`src/db/schema.ts`** - Add your domain tables
4. **`src/lib/types.ts`** - Add your TypeScript types
5. **`package.json`** - Update name, description
6. **`README.md`** - Update project documentation

## Project Overview
Minimal Next.js starter template with cookie-based auth, SQLite database, and Tailwind CSS.

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- SQLite via libsql + Drizzle ORM
- Tailwind CSS 4
- Plain components (no Radix dependencies)
- Framer Motion for animations
- React Hook Form + Zod for forms

## Commands
```bash
pnpm dev          # Start dev server (auto-creates DB)
pnpm build        # Production build
pnpm db:studio    # Open Drizzle Studio
```

## Project Structure
```
src/
├── app/
│   ├── api/auth/     # Auth endpoints (login, signup, logout, me, profile)
│   ├── api/upload/   # File upload endpoint
│   ├── login/        # Login page
│   ├── signup/       # Signup page
│   └── page.tsx      # Home page
├── components/ui/    # Reusable UI components
├── db/
│   ├── index.ts      # DB connection + auto-migrations
│   └── schema.ts     # Drizzle schema (ADD YOUR TABLES HERE)
└── lib/
    ├── auth.ts       # Session helpers
    ├── types.ts      # TypeScript types (ADD YOUR TYPES HERE)
    └── utils.ts      # cn() utility for classnames
```

## Key Patterns

### Adding a new table
1. Add schema in `src/db/schema.ts`
2. Add types in `src/lib/types.ts`
3. Create API route in `src/app/api/[resource]/route.ts`
4. DB auto-migrates on dev server start

### Auth helpers
```typescript
import { getCurrentUser, getSession } from "@/lib/auth";

// In API routes
const session = await getSession();
if (!session) return new Response("Unauthorized", { status: 401 });

// Get full user object
const user = await getCurrentUser();
```

### File uploads
Files go to `public/uploads/`, served via `/uploads/[path]`

## Environment Variables
```
DATABASE_URL=file:./data/app.db
SESSION_SECRET=your-secret-here
INVITE_CODE=optional-signup-code
```

## Style Guide
- Dark theme by default
- Use `cn()` for conditional classnames
- Keep components simple and composable
- Prefer native HTML elements over complex abstractions
