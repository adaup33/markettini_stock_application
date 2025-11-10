### Changes Summary (Watchlist & Search UI)

#### What we fixed/added
- Fixed oversized star icon in search results that distorted row height ("1 inch bar").
  - Updated `.watchlist-star` class to a small, consistent size and introduced optional large variant `.watchlist-star-lg` only for empty-state illustrations.
- Ensured the Add/Remove Watchlist flow works end-to-end from both the button on stock pages and the star icon in search results.
  - `WatchlistButton` now performs optimistic API calls by default when clicked (POST/DELETE to `/api/watchlist`). It still supports an `onWatchlistChange` override.
- Added a diagnostics API and page to verify the watchlist database connection, indexes, and sample data.
  - API: `GET /api/diagnostics/watchlist?email=you@example.com`
  - Page: `/diagnostics/watchlist?email=you@example.com`
- Documented the watchlist schema, indices, and how it relates to the user (implicit foreign key by `userId`).

---

### Files changed

1) app/globals.css
- Old `.watchlist-star` forced a large icon and broke search row height.
- New:
```
.watchlist-star { @apply h-4 w-4 text-gray-500; }
.watchlist-star-lg { @apply h-16 w-16 text-gray-500 mb-4; }
```

2) components/WatchlistButton.tsx
- Added default API calls to `/api/watchlist` for add/remove with optimistic UI update and failure rollback.
- Accepts `company` prop (already in types); POST sends `{ symbol, company }`.

3) app/api/diagnostics/watchlist/route.ts (new)
- Returns DB connectivity, user lookup by email, watchlist counts, sample rows, and verifies the unique index on `{ userId: 1, symbol: 1 }`.
- Use: `GET /api/diagnostics/watchlist?email=user@example.com`

4) app/diagnostics/watchlist/page.tsx (new)
- Simple diagnostics page that calls the above API and renders JSON for browser inspection.


---

### Existing watchlist schema and relations

- Model file: `database/models/watchlist.model.ts`
- Interface/fields:
  - `userId: string` — implicit foreign key referencing Better Auth `user` collection (`user.id` when present, else Mongo `_id`).
  - `symbol: string` — uppercased ticker symbol.
  - `company: string` — display name; typically the company name.
  - `addedAt: Date` — defaults to `Date.now`.
- Indexes:
  - Unique compound index on `{ userId: 1, symbol: 1 }` — prevents duplicate ticker per user.
  - `userId` is also `index: true` for fast queries.
- Relations:
  - MongoDB has no enforced foreign keys; relation is maintained by carrying the `userId` string in each watchlist document, which points to the Better Auth `user` document. Our server actions resolve `userId` from the provided or authenticated `email`.

Diagram: `diagrams/watchlist-erd.mmd`
```
User(id,email,name)
  ^ has many
Watchlist(_id,userId,symbol,company,addedAt)
```

---

### Watchlist server actions and API flow

- Server actions: `lib/actions/watchlist.actions.ts`
  - `getWatchlistByEmail(email)`
    - Resolves `userId` from auth DB (`user` collection), then returns watchlist rows for that user.
  - `addSymbolToWatchlist(email, symbol, company)`
    - Resolves `userId`; normalizes `symbol` to uppercase; upserts on `{ userId, symbol }` to avoid duplicates.
  - `removeSymbolFromWatchlist(email, symbol)`
    - Resolves `userId`; deletes `{ userId, symbol }`.
- API route: `app/api/watchlist/route.ts`
  - `GET` returns enriched watchlist items and (when available) attaches quote data.
  - `POST` adds `{ symbol, company }` for current auth user (or explicit `email` in body).
  - `DELETE` removes by `symbol` for current auth user (or explicit `email` via query).

---

### How to test the watchlist database connection

1) Ensure environment
- `.env` contains a valid `MONGODB_URI`.
- App is running (dev or prod).

2) Hit diagnostics API
- Browser or curl: `/api/diagnostics/watchlist?email=YOUR_EMAIL`
- Expected JSON fields:
  - `ok: true`
  - `db.readyState` is `1` (connected) after first request.
  - `watchlist.hasUserSymbolUniqueIndex: true` confirms index exists.
  - Optional: `watchlist.sampleForUser` shows latest 5 items for that user.

3) View diagnostics page
- Navigate to `/diagnostics/watchlist?email=YOUR_EMAIL` to see the same data rendered.

---

### How to verify watchlist functionality end-to-end

A) From the Stock Details page
- Open `/stocks/AAPL`.
- Click the "Add to Watchlist" button.
  - UI toggles immediately (optimistic).
  - API call to `POST /api/watchlist` is performed; on failure, state reverts and error logged.
- Click again to remove; `DELETE /api/watchlist?symbol=AAPL` is called.

B) From Search
- Open the Search dialog (button or Ctrl/Cmd+K).
- Search for a symbol; click the star icon next to a result to add/remove.
- The star no longer distorts row height — small, inline icon is used.

C) Verify in Watchlist table (if applicable)
- Navigate to your Watchlist page/component (e.g., Profile or Watchlist view) and confirm item presence.

D) Diagnostics check
- Revisit `/api/diagnostics/watchlist?email=YOUR_EMAIL` and confirm counts change accordingly.

---

### Notes & considerations
- Unique index prevents duplicate symbols per user; repeated adds are safe due to upsert.
- If auth context is unavailable, you can pass `email` explicitly to the API during testing.
- The server actions normalize `symbol` to uppercase for consistency.

---

### Dev tips
- If the diagnostics API shows `db.readyState: 0`, double‑check `MONGODB_URI`.
- If `hasUserSymbolUniqueIndex` is false on a fresh DB, Mongoose will create it at runtime. You can force index creation by starting the server once or using `Watchlist.syncIndexes()` in a script.


---

#### 2025-11-07 — Watchlist API robustness and clearer failures

- Improved email resolution in `app/api/watchlist/route.ts` for all methods:
  - Accept `email` from multiple sources: request body, URL query, `X-User-Email` header, Better Auth session, and a development fallback env var (`DEV_WATCHLIST_EMAIL` or `NEXT_PUBLIC_DEV_EMAIL`) when `NODE_ENV !== 'production'`.
- Return proper HTTP status codes:
  - `POST`/`DELETE /api/watchlist` now respond with `400` when the underlying action returns `{ success: false }` (e.g., missing email/user not found). Previously, the route returned `200`, which could mask failures on the client and leave the UI in an optimistic state even though no DB change occurred.
  - WebSocket broadcast is only attempted on success.
- How to test locally without auth wired:
  1. Set `DEV_WATCHLIST_EMAIL=you@example.com` (or `NEXT_PUBLIC_DEV_EMAIL`) in `.env.local`.
  2. Restart the dev server.
  3. Use the UI to add/remove, or call the API directly:
     - Add: `POST /api/watchlist` with body `{ "symbol": "AAPL", "company": "Apple Inc" }` (email resolved via env fallback).
     - Remove: `DELETE /api/watchlist?symbol=AAPL`.
  4. Verify with `GET /api/watchlist?email=you@example.com` or open `/api/diagnostics/watchlist?email=you@example.com`.
- Caveat: The watchlist links to the Better Auth `user` collection by `userId`. Ensure a matching user document exists for the chosen email; otherwise the action will return `{ success:false, error:"User not found" }` with HTTP 400.


---

### 2025-11-07 — Use Nodemailer env email as watchlist fallback (kept current architecture)

What changed
- Kept the existing Next.js App Router architecture and endpoints — no structural changes.
- Added a safe, explicit fallback so watchlist API routes can use your Nodemailer env email when no user email is available from the request or auth.
- Added response metadata to the watchlist API for easier diagnostics.

Details
- File: `app/api/watchlist/route.ts`
  - New resolver order for email:
    1) Request: body `email` → query `email` → headers `x-user-email`|`x-useremail`.
    2) Better Auth session (if available).
    3) Nodemailer env fallback: `NODEMAILER_EMAIL` — used only when fallback is allowed.
    4) Development-only legacy fallbacks: `DEV_WATCHLIST_EMAIL` → `NEXT_PUBLIC_DEV_EMAIL`.
  - Production safety guard:
    - Fallback is allowed when `NODE_ENV !== 'production'` OR `WATCHLIST_ALLOW_SMTP_EMAIL=1`.
  - Responses now include `meta`:
    - `email` (resolved value or null)
    - `emailSource`: `body` | `query` | `header` | `auth` | `nodemailer_env` | `dev_fallback` | `none`
    - `emailDetail`: which env var was used when applicable (e.g., `NODEMAILER_EMAIL`).
    - `nodemailerAllowed`: whether the guard permitted SMTP email fallback.
    - `nodemailerEnvSet`: whether `NODEMAILER_EMAIL` is present.

Why
- You requested using the Nodemailer env email while keeping the current architecture.
- This enables single-user/dev testing without full auth wiring, while keeping production guarded unless explicitly enabled.

How to use & test
- Dev/local (no auth wired):
  1) Set in `.env.local`:
     - `NODEMAILER_EMAIL=you@example.com`
     - Optionally, `WATCHLIST_ALLOW_SMTP_EMAIL=1` (if you’re simulating production).
  2) Restart the dev server.
  3) Click Add/Remove in the UI; then inspect the API response JSON or call:
     - `GET /api/watchlist` → response `meta.emailSource` should be `nodemailer_env`.
     - Or open `/api/diagnostics/watchlist?email=you@example.com` to see watchlist state.
- Production-like:
  - By default, fallback won’t be used when `NODE_ENV=production` unless you set `WATCHLIST_ALLOW_SMTP_EMAIL=1`.
  - If you enable the flag, ensure you understand this makes all watchlist changes act as the single `NODEMAILER_EMAIL` user.

Operational note
- Using a static env email implies a single logical user; this is fine for demos, single-user setups, or batch jobs, but not appropriate for multi-user production unless explicitly intended and guarded.

Files touched in this change
- `app/api/watchlist/route.ts` — email resolver, guard, and `meta` in responses.

