#!/usr/bin/env node
/*
  Setup database collections and indexes for the stock_application.
  - Ensures watchlists unique index { userId: 1, symbol: 1 }
  - Backfills optional fields (marketCap, peRatio, alert) to null when absent
  - Ensures alerts collection exists and creates indexes
*/

import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to your .env file.');
    process.exit(1);
  }

  let dbName = process.env.MONGODB_DB;
  if (!dbName) {
    try {
      const u = new URL(uri);
      dbName = u.pathname?.replace(/^\//, '') || 'test';
    } catch (e) {
      dbName = 'test';
    }
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();

  const db = client.db(dbName);
  console.log(`[setup-db] Connected to ${db.databaseName}`);

  // 1) Ensure watchlists collection and indexes
  const watchlists = db.collection('watchlists');
  try {
    await watchlists.createIndex({ userId: 1, symbol: 1 }, { unique: true, name: 'uniq_user_symbol' });
    console.log('[setup-db] Ensured index on watchlists {userId, symbol} unique');
  } catch (e) {
    console.warn('[setup-db] Could not create index on watchlists:', e?.message || e);
  }

  // MIGRATION: convert legacy string fields → numeric fields
  // - marketCap(string with K/M/B/T) → marketCapB(number in billions)
  // - peRatio(string) → peRatio(number)
  // - alert(string) → alertPrice(number)
  function parseMarketCapToBillions(v) {
    if (v == null) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null; // already billions
    if (typeof v !== 'string') return null;
    const s = v.trim().toUpperCase();
    if (!s) return null;
    const m = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*([TMBK])?$/);
    if (!m) {
      const n = Number(s);
      return isFinite(n) ? n : null;
    }
    const num = Number(m[1]);
    if (!isFinite(num)) return null;
    const suffix = m[2];
    switch (suffix) {
      case 'T': return num * 1000;
      case 'B': return num;
      case 'M': return num / 1000;
      case 'K': return num / 1_000_000;
      default: return num;
    }
  }
  function parseNumberMaybe(v) {
    if (v == null) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (typeof v === 'string') { const n = Number(v.trim()); return isFinite(n) ? n : null; }
    return null;
  }

  const cursor = watchlists.find({ $or: [
    { marketCap: { $type: 'string' } },
    { peRatio: { $type: 'string' } },
    { alert: { $type: 'string' } },
    { marketCapB: { $exists: false } },
    { alertPrice: { $exists: false } },
  ]});
  let migrated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) break;
    const updates = {};
    if (doc.marketCapB === undefined) {
      const m = parseMarketCapToBillions(doc.marketCap);
      if (m != null) updates.marketCapB = m;
    }
    if (doc.peRatio === undefined || typeof doc.peRatio === 'string') {
      const p = parseNumberMaybe(doc.peRatio);
      if (p != null) updates.peRatio = p;
    }
    if (doc.alertPrice === undefined) {
      const a = parseNumberMaybe(doc.alert);
      if (a != null) updates.alertPrice = a;
    }
    const unset = {};
    // Optionally unset legacy string fields
    if (typeof doc.marketCap === 'string') unset.marketCap = '';
    if (typeof doc.alert === 'string') unset.alert = '';

    if (Object.keys(updates).length > 0 || Object.keys(unset).length > 0) {
      await watchlists.updateOne({ _id: doc._id }, { ...(Object.keys(updates).length ? { $set: updates } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) });
      migrated++;
    }
  }
  console.log(`[setup-db] Migrated ${migrated} watchlist docs to numeric fields`);

  // 2) Ensure alerts collection and indexes
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const hasAlerts = collections.some((c) => c.name === 'alerts');
  if (!hasAlerts) {
    await db.createCollection('alerts');
    console.log('[setup-db] Created alerts collection');
  }
  const alerts = db.collection('alerts');
  try {
    await alerts.createIndex({ userId: 1 }, { name: 'idx_userId' });
    await alerts.createIndex({ userId: 1, symbol: 1 }, { name: 'idx_user_symbol' });
    console.log('[setup-db] Ensured indexes on alerts');
  } catch (e) {
    console.warn('[setup-db] Could not ensure alerts indexes:', e?.message || e);
  }

  await client.close();
  console.log('[setup-db] Done');
}

main().catch((err) => {
  console.error('[setup-db] Failed:', err);
  process.exit(1);
});
