export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { connectToDb } from '@/database/mongoose'
import { Watchlist } from '@/database/models/watchlist.model'

function safeNow() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now()
  return Date.now()
}

export async function GET(req: Request) {
  const started = safeNow()
  let dbReadyState: number | null = null
  let connectMs = -1
  let emailParam: string | undefined

  try {
    const url = new URL(req.url)
    emailParam = url.searchParams.get('email') || undefined
  } catch {
    emailParam = undefined
  }

  try {
    const dbStart = safeNow()
    const mongoose = await connectToDb()
    connectMs = safeNow() - dbStart
    dbReadyState = mongoose.connection.readyState

    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({ ok: false, error: 'No db connection', dbReadyState }, { status: 500 })
    }

    // Resolve user by email if provided (Better Auth stores users in `user` collection)
    let user: any = null
    let userId: string | null = null
    if (emailParam) {
      user = await db.collection('user').findOne({ email: emailParam })
      if (user) {
        userId = (user.id as string) || String(user._id || '') || null
      }
    }

    // Get counts and sample for watchlist (global and/or per user)
    const totalWatchlist = await Watchlist.countDocuments({})

    let watchlistCountForUser: number | null = null
    let sampleForUser: { symbol: string; company: string; addedAt: string }[] | null = null

    if (userId) {
      watchlistCountForUser = await Watchlist.countDocuments({ userId })
      const sample = await Watchlist.find({ userId }).sort({ addedAt: -1 }).limit(5).lean()
      sampleForUser = sample.map((d: any) => ({
        symbol: String(d.symbol),
        company: String(d.company ?? d.symbol),
        addedAt: new Date(d.addedAt || Date.now()).toISOString(),
      }))
    }

    // Inspect indexes for correctness
    let hasUserSymbolUniqueIndex = false
    try {
      const indexes = await Watchlist.collection.indexes()
      hasUserSymbolUniqueIndex = !!indexes.find(
        (idx: any) => idx?.key && idx.key.userId === 1 && idx.key.symbol === 1 && idx.unique === true
      )
    } catch (_) {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      timings: { connectMs: Number(connectMs.toFixed(2)), totalMs: Number((safeNow() - started).toFixed(2)) },
      db: { readyState: dbReadyState },
      input: { email: emailParam },
      user: {
        found: !!user,
        id: userId,
      },
      watchlist: {
        totalCount: totalWatchlist,
        countForUser: watchlistCountForUser,
        sampleForUser,
        hasUserSymbolUniqueIndex,
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'diagnostics failed', dbReadyState },
      { status: 500 }
    )
  }
}
