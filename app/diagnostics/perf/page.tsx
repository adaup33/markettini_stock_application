export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import React from 'react'

async function getPerf() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/diagnostics/perf`, {
    // If BASE_URL isn't set, rely on relative fetch in Node runtime
    cache: 'no-store',
  }).catch(() => null)

  if (!res || !res.ok) {
    // Fallback to relative URL (works in Next.js server components)
    const rel = await fetch('/api/diagnostics/perf', { cache: 'no-store' })
    return rel.json()
  }

  return res.json()
}

export default async function PerfDiagnosticsPage() {
  const data = await getPerf()

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Performance Diagnostics</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Use this page to understand where time is spent on the server. In development, first-load
        times of 3–6s can be normal due to compilation and cold starts. Production builds are
        much faster. See guidance below.
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">Server Timings</h2>
        <pre className="rounded border p-3 bg-[var(--background,#0b0b0b)] overflow-x-auto text-sm">
{JSON.stringify(data, null, 2)}
        </pre>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">How to interpret</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>
            handlerTotalMs: Total time for this API route. Includes DB connect and any work
            performed in the handler.
          </li>
          <li>
            dbConnectMs: Time for Mongoose to provide a connection. On the first request, this may be
            higher as the driver establishes connections. Subsequent requests should be low (usually
            &lt; 50ms) thanks to connection caching.
          </li>
          <li>
            server.coldStart: true indicates a fresh process or the first invocation of this route.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-2">Checklist</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Development vs Production: dev builds are slower due to live transforms and HMR.</li>
          <li>Images & Fonts: ensure large images are optimized and fonts are preloaded if render-blocking.</li>
          <li>Third-party scripts: defer or lazy‑load analytics/chat widgets.</li>
          <li>Middleware: avoid heavy logic in middleware; it runs on every request.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Test production locally</h2>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>Build: <code>npm run build</code></li>
          <li>Start: <code>npm start</code></li>
          <li>
            Open DevTools Network tab, reload, and check the initial document request TTFB and waterfall.
          </li>
        </ol>
      </section>
    </div>
  )
}
