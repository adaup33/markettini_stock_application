#!/usr/bin/env node

// Simple CLI to check the /api/db-check route
// Usage:
//   npm run test:db
//   npm run test:db -- --url=http://localhost:3000
// The script will exit with non-zero code on failure.

(async () => {
  try {
    const args = process.argv.slice(2);
    const urlArg = args.find((a) => a.startsWith('--url='));
    const baseUrl = (urlArg && urlArg.slice('--url='.length)) || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const trimmedBase = baseUrl.replace(/\/$/, '');
    const url = `${trimmedBase}/api/db-check?t=${Date.now()}`;

    console.log(`[test:db] Hitting: ${url}`);

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }

    if (!response.ok) {
      console.error(`[test:db] HTTP ${response.status} ${response.statusText}`);
      console.error(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // Pretty-print the JSON response
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));

    const ok = data && data.ok === true;
    const readyState = data && data.readyState;

    if (ok && (readyState === 1 || readyState === '1')) {
      console.log('[test:db] OK: Database connection confirmed.');
      process.exit(0);
    } else {
      console.error('[test:db] FAIL: Endpoint responded but database not confirmed as connected.');
      process.exit(2);
    }
  } catch (err) {
    console.error('[test:db] Request failed:', err && err.message ? err.message : String(err));
    console.error('[test:db] Is your Next.js server running? Start it in another terminal with: npm run dev');
    process.exit(3);
  }
})();
