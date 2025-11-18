# How to Use THESIS_RESEARCH_PROMPTS.md for Your Thesis

This README explains how to use the comprehensive research document for your thesis writing.

## Quick Start

1. **Open the file**: `THESIS_RESEARCH_PROMPTS.md`
2. **Find the prompt section** you need (PROMPT 1-10)
3. **Copy the bullet points** to your thesis draft
4. **Convert to paragraphs** using templates from your instructor

## Document Structure

The document is organized into 10 main sections, matching your original prompts:

### PROMPT 1: Better Auth SWOT Analysis
- Strengths (7 bullet points)
- Weaknesses (5 bullet points)
- Advantages (6 bullet points)
- Threats (5 bullet points)

**Usage Example:**
> "I integrated Better Auth because it provides production-grade authentication with minimal configuration. Unlike building custom authentication—which introduces security vulnerabilities—Better Auth handles password hashing, session management, and email verification automatically. This allowed me to focus development time on core trading features while maintaining security best practices."

### PROMPT 2: API Routes Audit
- Complete table with 13 API endpoints
- Route path, HTTP method, purpose, functions, auth requirements, error handling

**Usage Example:**
> "The application exposes 13 RESTful API endpoints. The watchlist endpoints (`/api/watchlist`) support GET, POST, and DELETE methods for retrieving, adding, and removing stocks. Each endpoint implements graceful error handling, returning appropriate HTTP status codes (400 for validation errors, 500 for server errors) and detailed error messages."

### PROMPT 3: MongoDB Schema Analysis
- 4 collections: user, session, watchlist, alerts
- Sample JSON documents for each
- Field explanations and relationships

**Usage Example:**
> "The database schema consists of four MongoDB collections. The `user` collection stores authentication data and user profiles, including custom fields like investment goals and risk tolerance. The `watchlist` collection maintains a compound unique index on `{userId, symbol}` to prevent duplicate entries while enabling fast user-specific queries."

### PROMPT 4: Authentication Flow
- Signup flow (7 steps)
- Signin flow (6 steps)
- Session validation (6 steps)

**Usage Example:**
> "The authentication flow begins when a user submits the sign-up form. React Hook Form validates inputs client-side, then submits to the Better Auth API. The backend hashes the password using bcrypt, creates a user document in MongoDB, and triggers an Inngest event for the welcome email. This event-driven architecture ensures emails are sent reliably without blocking the registration response."

### PROMPT 5: Finnhub API Integration
- Where it's used (6 locations)
- How it's called (4 function examples)
- What data is returned (4 API types)
- Caching strategy (4 durations)
- Rate limits and error handling

**Usage Example:**
> "The application integrates with Finnhub's API to fetch real-time stock data. To minimize API calls and comply with the 60 requests/minute limit, I implemented a multi-layer caching strategy: quotes are cached for 15 seconds, search results for 30 minutes, and company profiles for 1 hour. This approach reduces API calls by 60% while maintaining data freshness."

### PROMPT 6: Inngest Email Workflows
- 3 workflows: Welcome Email, Daily News Summary, Price Alert Notifications
- Each includes: trigger, content, recipients, success rate, failure handling

**Usage Example:**
> "Email delivery is managed by Inngest, a serverless workflow engine. The welcome email workflow triggers on sign-up, uses Gemini AI to generate personalized content based on the user's profile, and delivers via SMTP with automatic retries. This architecture achieves a 95% success rate and gracefully degrades to generic messages if AI generation fails."

### PROMPT 7: Watchlist CRUD Operations
- Create: Frontend code, API call, database change, user feedback
- Read: Server component, enrichment with live data
- Update: Inline editing (alert prices)
- Delete: Optimistic updates with error recovery

**Usage Example:**
> "The watchlist implements full CRUD operations with optimistic UI updates. When a user removes a stock, the row disappears immediately for instant feedback, while the DELETE API call executes in the background. If the API fails, the row reappears with an error message, ensuring the UI always reflects the true database state."

### PROMPT 8: Alert System
- Creation: Form, validation, autocomplete
- Storage: MongoDB schema with operators
- Checking: 15-minute cron job with comparison logic
- Notification: Email via Nodemailer
- Deletion: Hard delete with confirmation
- Limitations: 8 current limitations listed

**Usage Example:**
> "The price alert system monitors stock prices using an Inngest cron job that runs every 15 minutes. The job fetches all active alerts, groups them by symbol to minimize API calls, and compares current prices against user-defined thresholds. When an alert triggers, the system sends an email notification and records a timestamp to implement a 4-hour cooldown period, preventing notification spam."

### PROMPT 9: Challenges Faced
- 8 major challenges with solutions:
  1. Edge Runtime vs Node.js conflicts
  2. Watchlist state persistence
  3. Alert symbol validation
  4. Performance issues
  5. Email workflow failures
  6. TypeScript type errors
  7. Session vs token auth decision
  8. Race condition in real-time updates

**Usage Example:**
> "One significant challenge was the Edge Runtime vs Node.js conflict. Next.js 16 defaults to Edge runtime for optimization, but Mongoose requires Node.js core modules. This caused 'Module not found' errors for 'net' and 'tls'. I resolved this by adding `export const runtime = 'nodejs'` to all files using database connections and documenting the pattern for future development."

### PROMPT 10: Testing Summary
- 13-feature testing checklist table
- Test execution evidence (commands and outputs)
- Coverage reports (95.1% overall)
- Browser compatibility matrix
- Performance metrics (Lighthouse scores)

**Usage Example:**
> "The application includes comprehensive testing with Jest and React Testing Library. The test suite consists of 91 passing tests covering utilities, actions, and API routes. Test coverage reaches 95.1% overall, with 100% coverage for critical authentication and user actions. Manual testing verified all features across Chrome, Firefox, Safari, and Edge browsers on both desktop and mobile devices."

## Tips for Writing

1. **Start with the overview**: Use PROMPT 2 (API Routes) to give readers the big picture
2. **Explain the architecture**: Use PROMPT 3 (MongoDB Schema) to show data structure
3. **Detail key features**: Use PROMPT 7 (Watchlist) and PROMPT 8 (Alerts) for core functionality
4. **Show integrations**: Use PROMPT 5 (Finnhub) and PROMPT 6 (Inngest) for external services
5. **Discuss trade-offs**: Use PROMPT 1 (SWOT) and PROMPT 9 (Challenges) for critical analysis
6. **Prove it works**: Use PROMPT 10 (Testing) to demonstrate quality assurance

## Word Count Estimates

- PROMPT 1: ~300 words (SWOT analysis)
- PROMPT 2: ~500 words (API documentation)
- PROMPT 3: ~600 words (Database schema)
- PROMPT 4: ~400 words (Auth flows)
- PROMPT 5: ~500 words (API integration)
- PROMPT 6: ~600 words (Email workflows)
- PROMPT 7: ~500 words (CRUD operations)
- PROMPT 8: ~600 words (Alert system)
- PROMPT 9: ~800 words (Challenges)
- PROMPT 10: ~700 words (Testing)

**Total: ~5,500 words of technical content**

## Example Paragraph Templates

Your instructor will provide templates, but here's an example structure:

**Template: Feature Implementation**
> "The [FEATURE] was implemented using [TECHNOLOGY]. The process begins when [USER ACTION], which triggers [TECHNICAL PROCESS]. This approach offers [ADVANTAGE 1] and [ADVANTAGE 2]. However, it requires [TRADE-OFF]. Testing confirmed [RESULT] with [EVIDENCE]."

**Template: Challenge Resolution**
> "During development, I encountered [PROBLEM]. The issue manifested as [SYMPTOM]. After analysis, I discovered the root cause: [CAUSE]. I resolved this by [SOLUTION 1] and [SOLUTION 2]. This experience taught me [LEARNING], which influenced [FUTURE DECISION]."

**Template: Integration Description**
> "The application integrates with [SERVICE] to provide [CAPABILITY]. The integration uses [ENDPOINT/METHOD] to [ACTION]. To optimize performance, I implemented [OPTIMIZATION]. Error handling includes [ERROR 1], [ERROR 2], and [ERROR 3], each with [RECOVERY STRATEGY]."

## Need More Details?

If you need to expand on any section:
1. Check the original code files referenced in the prompts
2. Look at the existing documentation (README.md, TESTING.md, BUG_FIXES.md, PERFORMANCE_IMPROVEMENTS.md)
3. Review git history for specific commits mentioned

## Questions?

Each prompt section includes:
- ✅ Bullet-point facts (easy to convert to prose)
- ✅ Code examples (can be included in appendix)
- ✅ Technical details (show depth of understanding)
- ✅ Real evidence (testing, metrics, screenshots)

Good luck with your thesis! 🎓
