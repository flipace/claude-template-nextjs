# Claude Template - Next.js

A minimal Next.js starter template with authentication, SQLite database, and plain UI components. Designed for fast project setup with Claude Code.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite via libsql + Drizzle ORM |
| Styling | Tailwind CSS 4 |
| UI Components | Plain shadcn-style (no Radix) |
| Animations | Framer Motion |
| Auth | Cookie-based sessions (bcrypt) |
| Forms | React Hook Form + Zod |

## Quick Start

```bash
# Install dependencies
pnpm install

# Push schema to database
pnpm db:push

# Run dev server
pnpm dev

# Build for production
pnpm build
```

## Database Commands

```bash
pnpm db:push      # Push schema changes to database (dev)
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Run migrations (production)
pnpm db:studio    # Open Drizzle Studio GUI
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, signup, logout, profile, me
│   │   └── upload/        # File uploads
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── uploads/           # Serve uploaded files
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/
│   └── ui/                # UI components (button, dialog, select, etc.)
│
├── db/
│   ├── index.ts           # Database connection
│   └── schema.ts          # Drizzle schema (users table)
│
├── drizzle/               # Generated migrations
│
└── lib/
    ├── auth.ts            # Session management
    ├── types.ts           # TypeScript interfaces
    └── utils.ts           # Utility functions (cn)
```

## Authentication

Cookie-based sessions with 30-day expiry:

```typescript
// src/lib/auth.ts
createSession(userId)  // Set auth cookie
getSession()           // Get current session
getCurrentUser()       // Get user data
clearSession()         // Logout
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | - | Create account |
| POST | `/api/auth/login` | - | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | - | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |
| POST | `/api/upload` | Yes | Upload file |

## Adding Your Domain Model

1. **Add tables** in `src/db/schema.ts`:
```typescript
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

2. **Push to database**:
```bash
pnpm db:push
```

3. **Add types** in `src/lib/types.ts`:
```typescript
export interface Post {
  id: string;
  userId: string;
  title: string;
  content?: string;
  createdAt: Date;
}
```

4. **Create API routes** in `src/app/api/posts/route.ts`

5. **Build your UI** in `src/components/` and `src/app/`

## Environment Variables

```env
DATABASE_URL=file:./data/app.db    # SQLite file path
SESSION_SECRET=your-secret-here     # For session signing
INVITE_CODE=optional-signup-code    # Required to signup (optional)
```

## UI Components

Plain React components in `src/components/ui/`:
- button, card, dialog, input, label, select, sheet, popover, badge, alert-dialog

## File Uploads

Files are stored in `public/uploads/` and served via `/uploads/[...path]`:

```typescript
// Upload
const formData = new FormData();
formData.append("file", file);
const res = await fetch("/api/upload", { method: "POST", body: formData });
const { path } = await res.json(); // "/uploads/abc123.png"

// Use
<img src={path} alt="..." />
```

---

Built for fast prototyping with Claude Code.
