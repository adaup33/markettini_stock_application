export const runtime = 'nodejs'

import { connectToDb } from '@/database/mongoose'

let coldStart = true

function now() {
  // Use high-resolution timer when available
  if (typeof performance !== 'undefined' && performance.now) return performance.now()
  return Date.now()
}

export async function GET() {
  const handlerStart = now()

  // Measure DB connect time (will be fast after first connect due to caching)
  const dbStart = now()
  let dbConnectMs = -1
  let dbReadyState: number | null = null
  let mongoUriRedacted: string | undefined

  try {
    const mongoose = await connectToDb()
    dbConnectMs = now() - dbStart
    dbReadyState = mongoose.connection.readyState
    const uri = process.env.MONGODB_URI
    if (uri) {
      // redact credentials/host details but show db/cluster hint
      try {
        const u = new URL(uri)
        const host = u.host
        const dbName = (u.pathname || '').replace(/^\//, '')
        mongoUriRedacted = `${host}/${dbName}`
      } catch {
        mongoUriRedacted = 'redacted'
      }
    }
  } catch (e) {
    dbConnectMs = now() - dbStart
    dbReadyState = null
  }

  const totalMs = now() - handlerStart

  const body = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.versions.node,
      platform: process.platform,
      isDev: process.env.NODE_ENV !== 'production',
      runtime: 'nodejs',
    },
    server: {
      coldStart, // true only on the first request for this route process
    },
    timings: {
      handlerTotalMs: Number(totalMs.toFixed(2)),
      dbConnectMs: Number(dbConnectMs.toFixed(2)),
    },
    database: {
      readyState: dbReadyState, // 0=disconnected,1=connected,2=connecting,3=disconnecting
      uri: mongoUriRedacted,
    },
  }

  // After collecting, flip coldStart so subsequent invocations report false
  coldStart = false

  const headers = new Headers()
  headers.set(
    'Server-Timing',
    [
      `db;desc="Mongoose connect";dur=${dbConnectMs.toFixed(2)}`,
      `handler;desc="Route handler total";dur=${totalMs.toFixed(2)}`,
    ].join(', ')
  )
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')

  return new Response(JSON.stringify(body, null, 2), { status: 200, headers })
}
