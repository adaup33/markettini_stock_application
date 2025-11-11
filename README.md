This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Edge Runtime vs Node.js in Next.js (and how this repo handles it)

What is the Edge Runtime?
- The Edge Runtime runs your code in lightweight V8 isolates at the network edge (e.g., Vercel Edge). It prioritizes ultra‑low latency, fast cold starts, and Web APIs.
- It does NOT support most Node.js core modules (fs, path, net, tls, http/https in Node style), CommonJS require, or many native addons. Only Web Platform APIs and the Edge subset of features are available.

When to use Edge vs Node:
- Use Edge for small, latency‑sensitive code that only needs Web APIs (e.g., simple rewrites, feature flags, cookie reading, bot detection, geo). Middleware always runs on Edge.
- Use Node.js for anything that needs Node libraries or long‑lived connections: MongoDB/Mongoose, PostgreSQL clients, bcrypt, Puppeteer, file system access, etc.

Why you were seeing errors “caused by Edge”
- Libraries like mongoose, mongodb (Node driver), bcrypt, and many auth libraries depend on Node core modules (net/tls/crypto, etc.). If a page/layout/route runs on Edge, those imports crash at runtime with errors like:
  - Module not found: 'net' / 'tls'
  - process is not defined
  - require is not defined
  - Mongo/Mongoose connection errors occurring before the handler runs

How we fixed it in this repo
- We forced Node.js runtime on any entrypoint that imports mongoose/better‑auth:
  - app/api/db-check/route.ts: export const runtime = 'nodejs'
  - app/{auth}/layout.tsx: export const runtime = 'nodejs'
- The database connection utility caches a single connection in globalThis to avoid reconnects across hot reloads and route invocations.

How you can avoid Edge issues going forward
1) If a file uses Node‑only APIs or imports Node‑only libs, add this at the top of that page/layout/route file:
   export const runtime = 'nodejs'
2) Keep DB and auth logic on the server (server components, route handlers, or server actions) and do not import those modules into client components.
3) Do NOT put DB calls into middleware.ts (middleware always runs on Edge). If you need auth in middleware, use a stateless, Edge‑compatible method (e.g., verify a JWT using WebCrypto) or move the check to a Node route.
4) If you see an Edge‑style error in a file, force Node runtime in that file and restart the dev server.

Common symptoms of Edge/runtime mismatch
- “Module not found: 'net' / 'tls' / 'fs'”
- “process is not defined” or “require is not defined”
- DB client fails before your code runs
- Works locally sometimes but fails when deployed to Vercel (Edge default applied by certain optimizations)

Verification checklist
- Server running: npm run dev
- DB connectivity: npm run test:db → should print ok: true and readyState: 1
- Auth pages: visit http://localhost:3000/sign-in or /sign-up. If you ever see an Edge‑related error, ensure the nearest page/layout has export const runtime = 'nodejs'.

Quick reference
- Per‑file runtime (recommended):
  export const runtime = 'nodejs' // or 'edge'
- Force dynamic response (disables static caching when debugging DB):
  export const dynamic = 'force-dynamic'

If you’re unsure whether a library works on Edge, assume it requires Node.js unless its docs explicitly say “Edge compatible.”


## Mongoose connection (singleton)

For how our Mongoose global singleton works, why we use it in Next.js, and how to use it safely, see:

- docs/mongoose-singleton.md
