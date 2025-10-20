# How to add a Next.js Server Action that uses Mongoose (DIY Guide)

This guide shows you how to add a minimal, working example of a Next.js Server Action that writes to MongoDB using Mongoose, plus a helper to read data and a demo page that revalidates after mutations.

You can follow these steps any time and remove them later without affecting the rest of your app.

---

## Prerequisites
- A MongoDB connection string available as `MONGODB_URI` in your `.env` file.
- Mongoose installed (already present in this repo). If needed:
  ```bash
  npm i mongoose
  ```
- This project already includes a connection helper at `database/mongoose.ts` which caches the connection across hot reloads. We will reuse it.

Important: Mongoose requires the Node.js runtime in Next.js (not Edge). Any page/layout/route that imports Mongoose or DB code must export:
```ts
export const runtime = 'nodejs'
```

---

## Step 1 — Create a Mongoose model
Create `models/Todo.ts`:

```ts
import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

// Define schema
const TodoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Types
export type Todo = InferSchemaType<typeof TodoSchema> & { _id: mongoose.Types.ObjectId };

// Avoid model recompilation on hot reloads
export const TodoModel: Model<Todo> =
  (mongoose.models.Todo as Model<Todo>) || mongoose.model<Todo>('Todo', TodoSchema);
```

Notes:
- The hot‑reload safe export avoids the "Cannot overwrite model once compiled" error during dev.

---

## Step 2 — Add a Server Action and a server helper
Create `lib/actions/todo.actions.ts`:

```ts
'use server'

import { connectToDb } from '@/database/mongoose'
import { TodoModel, type Todo } from '@/models/Todo'
import { revalidatePath } from 'next/cache'

// Server Action to create a todo from <form action={...}> submissions
export async function createTodoAction(formData: FormData) {
  try {
    const rawTitle = formData.get('title')
    const title = typeof rawTitle === 'string' ? rawTitle.trim() : ''

    if (!title) {
      return { success: false, error: 'Title is required' }
    }

    await connectToDb()

    const doc = await TodoModel.create({ title })

    // Revalidate the demo page so the new item appears without a manual refresh
    revalidatePath('/examples/server-actions-mongoose')

    return { success: true, data: { id: String(doc._id) } }
  } catch (err) {
    console.error('createTodoAction error', err)
    return { success: false, error: 'Failed to create todo' }
  }
}

// Helper used in server components to render data (not a server action)
export async function listTodos(): Promise<Todo[]> {
  await connectToDb()
  const todos = await TodoModel.find().sort({ createdAt: -1 }).lean<Todo[]>()
  return todos
}
```

Notes:
- Because it’s a Server Action (`'use server'`), you can set it as a form `action` and Next will handle the POST automatically.
- `revalidatePath` triggers a refresh for the page that lists the data.

---

## Step 3 — Add a demo page that uses the action
Create `app/examples/server-actions-mongoose/page.tsx`:

```tsx
export const runtime = 'nodejs'

import { createTodoAction, listTodos } from '@/lib/actions/todo.actions'

export default async function ServerActionsWithMongoosePage() {
  const todos = await listTodos()

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Server Actions + Mongoose</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This page shows how to use a Next.js Server Action to write to MongoDB via Mongoose.
      </p>

      <form action={createTodoAction} className="flex gap-2 mb-6">
        <input
          type="text"
          name="title"
          placeholder="Add a todo title..."
          className="flex-1 rounded border px-3 py-2"
          required
        />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {todos.length === 0 && (
          <li className="text-sm text-muted-foreground">No todos yet. Add one above.</li>
        )}
        {todos.map((t) => (
          <li key={String(t._id)} className="rounded border p-3">
            <div className="font-medium">{t.title}</div>
            <div className="text-xs text-muted-foreground">{new Date((t as any).createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Notes:
- The page is a Server Component by default, which is fine. It calls `listTodos()` directly and uses a `<form action={createTodoAction}>` to insert.
- The `runtime = 'nodejs'` export ensures the page runs on Node (required by Mongoose).

---

## Step 4 — Run it
1. Ensure `.env` contains a valid connection string:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Visit:
   - http://localhost:3000/examples/server-actions-mongoose
4. Add a todo. The list should update automatically after submit.

---

## Step 5 — Clean up (optional)
If you want to remove the demo later, delete the following files:
- `models/Todo.ts`
- `lib/actions/todo.actions.ts`
- `app/examples/server-actions-mongoose/page.tsx`

Optionally remove the now-empty `app/examples/server-actions-mongoose` folder.

---

## Troubleshooting
- Edge vs Node errors (e.g., "Module not found: 'net'" or "process is not defined"): ensure the page or route handler that imports Mongoose exports `export const runtime = 'nodejs'`.
- Env var issues: make sure `MONGODB_URI` is set and restart `npm run dev` after changes to `.env`.
- Revalidation not working: verify the path you pass to `revalidatePath` exactly matches the page route you want to refresh.
- TypeScript path alias: this repo uses `@/*` → `./*` (see `tsconfig.json`). Keep imports like `@/database/mongoose` and `@/models/Todo`.

---

## What this adds to your app
- A safe, cached Mongo connection helper (already present in `database/mongoose.ts`).
- A simple Mongoose model and a Server Action that creates documents.
- A demo page that reads and writes data and revalidates itself after mutations.

You can adapt this pattern to your own collections, validation, and pages.