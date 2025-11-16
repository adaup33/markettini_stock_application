# Troubleshooting Watchlist and Alerts API 400 Errors

## Common Causes of "Bad Request 400"

The watchlist and alerts APIs now have proper validation that checks for required parameters. If you're getting a 400 error, here's how to diagnose and fix it:

### 1. Missing Email

**Error Response:**
```json
{
  "success": false,
  "error": "Missing email",
  "meta": {
    "email": null,
    "emailSource": "none",
    "emailDetail": null
  }
}
```

**Cause:** The API couldn't find an email from any source (body, query, header, auth session, or environment variables).

**Solutions:**

#### Option A: Pass email in request body (for POST/PATCH)
```javascript
fetch('/api/watchlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',  // Add this
    symbol: 'AAPL',
    company: 'Apple Inc.'
  })
});
```

#### Option B: Pass email in query parameters (for GET/DELETE)
```javascript
fetch('/api/watchlist?email=user@example.com&symbol=AAPL', {
  method: 'DELETE'
});
```

#### Option C: Pass email in headers
```javascript
fetch('/api/watchlist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': 'user@example.com'  // Add this
  },
  body: JSON.stringify({ symbol: 'AAPL', company: 'Apple Inc.' })
});
```

#### Option D: Set up authentication
If you have Better Auth configured, the API will automatically derive the email from the authenticated session.

#### Option E: Use environment variables (development only)
Set one of these in your `.env.local`:
```bash
# Option 1: For development watchlist/alerts
DEV_WATCHLIST_EMAIL=dev@example.com

# Option 2: For client-side (prefix with NEXT_PUBLIC_)
NEXT_PUBLIC_DEV_EMAIL=dev@example.com

# Option 3: For SMTP-based email (when WATCHLIST_ALLOW_SMTP_EMAIL=1 or NODE_ENV != production)
NODEMAILER_EMAIL=nodemailer@example.com
```

### 2. Missing Symbol

**Error Response:**
```json
{
  "success": false,
  "error": "Missing symbol",
  "meta": {
    "email": "user@example.com",
    "emailSource": "body",
    "emailDetail": null
  }
}
```

**Cause:** The `symbol` parameter is required but was not provided.

**Solution:** Always include the symbol in your request:
```javascript
fetch('/api/watchlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    symbol: 'AAPL',  // Required!
    company: 'Apple Inc.'
  })
});
```

### 3. User Not Found (Alerts Only)

**Error Response:**
```json
{
  "success": false,
  "error": "user not found",
  "meta": {
    "email": "nonexistent@example.com"
  }
}
```

**Cause:** The email was provided, but no user exists in the database with that email.

**Solution:** 
1. Make sure the user account exists (they should have signed up/signed in at least once)
2. Verify the email matches exactly what's in the database
3. Check the diagnostics endpoint: `/api/diagnostics/watchlist?email=user@example.com`

## Diagnostics

### Check Database Connection and User
Visit: `/api/diagnostics/watchlist?email=YOUR_EMAIL`

This will show:
- Database connection status
- Whether the user exists
- User's watchlist count
- Sample watchlist items

Example response:
```json
{
  "ok": true,
  "db": { "readyState": 1 },
  "user": {
    "found": true,
    "id": "user123"
  },
  "watchlist": {
    "totalCount": 25,
    "countForUser": 3,
    "sampleForUser": [...]
  }
}
```

### Email Resolution Priority

The API tries to find an email in this order:
1. Request body (`{ email: "..." }`)
2. Query parameter (`?email=...`)
3. Header (`x-user-email: ...`)
4. Auth session (if Better Auth is configured)
5. `NODEMAILER_EMAIL` env var (if allowed)
6. `DEV_WATCHLIST_EMAIL` or `NEXT_PUBLIC_DEV_EMAIL` (dev mode only)

The `meta.emailSource` field in error responses tells you which method was used (or "none" if none worked).

## Testing with cURL

### POST /api/watchlist
```bash
curl -X POST http://localhost:3000/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","symbol":"AAPL","company":"Apple Inc."}'
```

### GET /api/watchlist
```bash
curl "http://localhost:3000/api/watchlist?email=test@example.com"
```

### DELETE /api/watchlist
```bash
curl -X DELETE "http://localhost:3000/api/watchlist?email=test@example.com&symbol=AAPL"
```

### POST /api/alerts
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","symbol":"AAPL","operator":">","threshold":150}'
```

## Quick Fix for Development

Add to `.env.local`:
```bash
NODE_ENV=development
DEV_WATCHLIST_EMAIL=dev@example.com
```

Then restart your dev server. The API will automatically use this email for all requests that don't explicitly provide one.
