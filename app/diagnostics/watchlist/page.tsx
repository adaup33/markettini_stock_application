export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import React from 'react'

async function getDiag(email?: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const qs = email ? `?email=${encodeURIComponent(email)}` : ''
  // Try absolute first to work in Node runtime; fallback to relative
  const abs = await fetch(`${base}/api/watchlist${qs}`, { cache: 'no-store' }).catch(() => null)
  if (abs && abs.ok) return abs.json()
  const rel = await fetch(`/api/watchlist${qs}`, { cache: 'no-store' })
  return rel.json()
}

export default async function WatchlistDiagnosticsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const email = typeof searchParams?.email === 'string' ? searchParams!.email : undefined
  const data = await getDiag(email)

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Watchlist Diagnostics</h1>
        <p className="text-sm text-muted-foreground">Quick checks for DB connection, user resolution, indexes, and sample watchlist rows.</p>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-medium mb-2">How to use</h2>
        <ul className="list-disc pl-6 text-sm space-y-1">
          <li>Optionally pass an email via query: <code>/diagnostics/watchlist?email=you@example.com</code></li>
          <li>Ensure <code>MONGODB_URI</code> is set in your environment.</li>
          <li>Expected index: unique on <code>{`{ userId: 1, symbol: 1 }`}</code>.</li>
        </ul>
      </div>

      <div>
        <h2 className="font-medium mb-2">Result</h2>
        <pre className="rounded border p-3 bg-[var(--background,#0b0b0b)] overflow-x-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )
}
