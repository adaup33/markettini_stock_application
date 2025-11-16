# Viewing Test Results in Vercel Deployments

This guide explains how to see API test results when deploying to Vercel.

## Quick Summary

✅ **Tests now run automatically during Vercel builds** via the `build:vercel` script
✅ **Test results appear in the Vercel build logs**
✅ **GitHub Actions show test summaries in PR checks**
✅ **Test artifacts are uploaded for download**

## Option 1: Vercel Build Logs (Recommended)

### How It Works
The `vercel.json` configuration specifies a custom build command that runs tests before building:

```json
{
  "buildCommand": "npm run build:vercel"
}
```

The `build:vercel` script runs:
1. `npm run test:api` - Runs all API route tests
2. `npm run build` - Builds the Next.js application

### Viewing Results

1. **Go to your Vercel deployment**
   - Visit https://vercel.com/your-username/markettini-stock-application

2. **Click on a deployment**
   - Select any deployment from the list

3. **View the Build Log**
   - Click the "Building" or "Logs" tab
   - Look for the test execution section:
   ```
   Running "npm run test:api"
   
   PASS  __tests__/app/api/watchlist.route.test.ts
     Watchlist API Routes
       GET /api/watchlist
         ✓ should return watchlist items with email from query parameter (9 ms)
         ✓ should return watchlist items with email from header (1 ms)
         ...
   
   Test Suites: 2 passed, 2 total
   Tests:       27 passed, 27 total
   ```

4. **If Tests Fail**
   - The build will stop and show the failure
   - Failed tests will be highlighted in red
   - You can see exactly which tests failed and why
   - The deployment will be cancelled

### Example Build Log Output

```bash
[12:34:56.789] Running build command: npm run build:vercel...
[12:34:57.123] 
[12:34:57.456] > stock_application@0.1.0 build:vercel
[12:34:57.789] > npm run test:api && npm run build
[12:34:58.012] 
[12:34:58.345] > stock_application@0.1.0 test:api
[12:34:58.678] > jest __tests__/app/api --passWithNoTests
[12:35:01.234] 
[12:35:01.567] PASS  __tests__/app/api/watchlist.route.test.ts
[12:35:01.890]   Watchlist API Routes
[12:35:02.123]     ✓ GET /api/watchlist tests (15/15 passed)
[12:35:02.456]     ✓ POST /api/watchlist tests (passed)
[12:35:02.789]     ✓ DELETE /api/watchlist tests (passed)
[12:35:03.012] 
[12:35:03.345] PASS  __tests__/app/api/alerts.route.test.ts
[12:35:03.678]   Alerts API Routes
[12:35:04.001]     ✓ GET /api/alerts tests (passed)
[12:35:04.334]     ✓ POST /api/alerts tests (passed)
[12:35:04.667] 
[12:35:05.000] Test Suites: 2 passed, 2 total
[12:35:05.333] Tests:       27 passed, 27 total
[12:35:05.666] Snapshots:   0 total
[12:35:05.999] Time:        7.321s
[12:35:06.332] 
[12:35:06.665] > stock_application@0.1.0 build
[12:35:06.998] > next build --turbopack
[12:35:07.331] 
[12:35:07.664] Building...
```

## Option 2: GitHub Actions (Pull Requests)

### How It Works
Every PR automatically runs tests via GitHub Actions (`.github/workflows/ci.yml`).

### Viewing Results

1. **Open a Pull Request**
2. **Scroll to the bottom** - you'll see check status
3. **Click "Details"** next to "CI / build"
4. **View the Test Summary** in the job summary:
   ```
   ## 🧪 Test Results
   ### Summary
   - Total Tests: 27
   - Passed: ✅ 27
   - Failed: ❌ 0
   - Skipped: ⏭️ 0
   - Duration: 7.32s
   ```

5. **Download Test Artifacts**
   - Scroll to the bottom of the Actions run
   - Find "Artifacts" section
   - Download `test-results` (includes JSON results and coverage report)

### PR Status Checks
- ✅ **Green checkmark** = All tests passed
- ❌ **Red X** = Tests failed (deployment blocked)
- 🟡 **Yellow circle** = Tests running

## Option 3: Local Testing Before Deploy

### Quick Check
Run the same tests that Vercel will run:
```bash
npm run test:api
```

### Full Test Suite
```bash
npm test
```

### With Coverage Report
```bash
npm run test:coverage
```

This generates a coverage report in `coverage/lcov-report/index.html` that you can open in a browser.

## Option 4: Vercel CLI

### Install Vercel CLI
```bash
npm i -g vercel
```

### Test Locally as Vercel Would
```bash
vercel build
```

This runs the same build command that Vercel uses, including tests.

## Disabling Tests in Vercel (Not Recommended)

If you need to deploy without running tests (emergency hotfix), you can temporarily:

1. **Edit `vercel.json`:**
   ```json
   {
     "buildCommand": "npm run build"
   }
   ```

2. **Or override in Vercel Dashboard:**
   - Go to Project Settings → Build & Development Settings
   - Override Build Command: `npm run build`

⚠️ **Remember to re-enable tests after the emergency!**

## Test Configuration

### Current Test Suites

| Test Suite | Location | Tests | Coverage |
|------------|----------|-------|----------|
| Watchlist API | `__tests__/app/api/watchlist.route.test.ts` | 15 | GET, POST, DELETE |
| Alerts API | `__tests__/app/api/alerts.route.test.ts` | 12 | GET, POST |
| Watchlist Actions | `__tests__/lib/actions/watchlist.actions.test.ts` | 9 | Business logic |

### What Gets Tested

✅ **Email resolution** from all sources (body, query, headers, env, auth)
✅ **Input validation** (missing email, missing symbol, etc.)
✅ **Error handling** (database errors, user not found, etc.)
✅ **Runtime configuration** (nodejs runtime export verification)
✅ **Data transformation** (uppercase symbols, numeric fields, etc.)

## Troubleshooting

### "Tests not running in Vercel"
1. Check `vercel.json` has `"buildCommand": "npm run build:vercel"`
2. Or check Vercel dashboard: Settings → Build & Development Settings
3. Verify the Build Command is set to `npm run build:vercel`

### "Tests pass locally but fail in Vercel"
- Check environment variables in Vercel dashboard
- API tests mock database connections, so this shouldn't happen
- Check the build logs for specific error messages

### "Build takes too long"
- Tests add ~10-15 seconds to build time
- This is normal and recommended for quality assurance
- If urgent, you can temporarily disable tests (see Option 4 above)

### "Want to see more detailed output"
Add verbose flag to test command in `package.json`:
```json
"test:api": "jest __tests__/app/api --verbose --passWithNoTests"
```

## Best Practices

1. ✅ **Always run tests before pushing** (`npm run test:api`)
2. ✅ **Check PR status** before merging
3. ✅ **Review test failures** in build logs
4. ✅ **Add new tests** when adding new API routes
5. ⚠️ **Never disable tests** in production deployments

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run test:api` | Run API tests only |
| `npm run build:vercel` | Run tests + build (what Vercel runs) |
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |
| `vercel build` | Test Vercel build locally |

## Example: Complete Deployment Flow

```bash
# 1. Make changes to API routes
vim app/api/watchlist/route.ts

# 2. Run tests locally
npm run test:api

# 3. Commit and push
git add .
git commit -m "Update watchlist API"
git push

# 4. Open PR
gh pr create --title "Update watchlist API"

# 5. Check GitHub Actions
# - Tests run automatically
# - View results in PR checks

# 6. Merge PR
# - Tests run again in main branch
# - Vercel deploys with tests

# 7. View deployment logs in Vercel
# - See test results in build log
# - Verify deployment succeeded
```

---

**Need Help?** Check the test output in:
- Vercel build logs: https://vercel.com/your-project/deployments
- GitHub Actions: https://github.com/your-repo/actions
- Local: `npm run test:api`
