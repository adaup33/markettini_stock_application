# Mongoose Singleton (Global Connection Cache)

This project uses a robust, Next.js-friendly singleton pattern to manage a single Mongoose connection across requests, hot reloads, and serverless invocations.

File: `database/mongoose.ts`

```ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDb = async () => {
  if (!MONGODB_URI) throw new Error('MONGODB_URI must be set within .env');

  // Return existing live connection
  if (cached.conn) return cached.conn;

  // Create a single in-flight promise if none exists
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset promise so future calls can retry cleanly
    cached.promise = null;
    throw err;
  }

  console.log('Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}');

  return cached.conn;
};
```

## Why a singleton?

- Next.js can re-evaluate modules during hot reload and across route handler invocations. If you call `mongoose.connect` every time without caching, you can quickly exhaust connections and see performance issues.
- By caching both the resolved connection (`conn`) and the in-flight connection promise (`promise`) on `globalThis`, we:
  - Share the same connection across requests/routes.
  - Avoid duplicate parallel connection attempts under load.
  - Survive hot-reloads in dev (module scope resets, but `globalThis` persists).

## How to use it

- Always call `await connectToDb()` in any server-only code path before using models:

```ts
// Server action or route handler
import { connectToDb } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

export async function someServerAction() {
  await connectToDb();
  const rows = await Watchlist.find({ userId: '...' }).lean();
  return rows;
}
```

- Do not import DB code in client components. Keep DB access in:
  - Route handlers (e.g., `app/api/**/route.ts`)
  - Server actions (files with `"use server"` at the top)
  - Server components

## Design details

- `global.mongooseCache` is declared in a `declare global` block for TypeScript. This lets us attach a stable cache to `globalThis` across HMR and serverless invocations.
- We cache:
  - `conn`: The resolved Mongoose module instance after a successful `mongoose.connect(...)`.
  - `promise`: The in-flight `Promise` returned by `mongoose.connect(...)`. This ensures only one connect attempt ever runs concurrently.
- `bufferCommands: false` disables Mongoose’s internal buffering so your app fails fast if the connection truly isn’t ready.
- On connection failure we set `cached.promise = null` so the next call can retry cleanly.

## Common pitfalls and tips

- Missing env var: If `MONGODB_URI` is not set, `connectToDb` throws immediately with a helpful message. Define it in `.env`.
- Edge runtime: Mongoose and the MongoDB driver require Node.js. If you see errors like `Module not found: 'net'` or `process is not defined`, ensure the file is running on Node:
  - Add `export const runtime = 'nodejs'` at the top of that route/page/layout.
- Tests: In unit tests, prefer mocking `connectToDb` and models (as this repo’s tests do). If you integrate real DB tests, remember to close connections after the test run.
- Client vs server: Never import `database/mongoose.ts` into client components. It will bloat the bundle and break at runtime.

## Quick checklist

- [ ] `.env` contains `MONGODB_URI`
- [ ] Server-only code calls `await connectToDb()` before using models
- [ ] No DB code in `middleware.ts` (Edge-only) or client components
- [ ] Force Node runtime in any file that imports `mongoose`

## Related files

- `database/mongoose.ts`: The singleton implementation.
- `database/models/*.ts`: Mongoose models that rely on the shared connection.
- `app/api/**/route.ts`, `lib/actions/**`: Server code that calls `connectToDb()` and uses models.
