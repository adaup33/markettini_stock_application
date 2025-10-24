# Environment example for stock_application

This file lists the environment variables used by the project. Do NOT commit real secrets — copy this to `.env.local` and fill values locally.

# Database
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/dbname?retryWrites=true&w=majority"
  - MongoDB connection string used by `database/mongoose.ts` and some API routes.

# Email (Nodemailer)
NODEMAILER_EMAIL="no-reply@example.com"
NODEMAILER_PASSWORD="your-email-password"
  - Credentials used by `lib/nodemailer/index.ts` to send emails. Keep these secret.

# Third-party / AI
GEMINI_API_KEY="sk-..."
  - API key used by `lib/inngest/client.ts` (AI features).

# Auth (better-auth)
BETTER_AUTH_SECRET="a-very-long-secret"
BETTER_AUTH_URL="https://auth.example.com"
  - Values used by `lib/better-auth/auth.ts`.

# Finnhub (market data)
NEXT_PUBLIC_FINNHUB_API_KEY="public-key-if-needed"
FINNHUB_API_KEY="server-side-key"
  - `NEXT_PUBLIC_FINNHUB_API_KEY` is exposed to the browser (prefix `NEXT_PUBLIC_`). `FINNHUB_API_KEY` is for server-side requests in `lib/actions/finnhub.actions.ts`.

# Next / Runtime
NODE_ENV="development"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
  - `NODE_ENV` and `NEXT_PUBLIC_BASE_URL` are referenced in diagnostic pages and client/server fetches.

# Notes
- Prefix environment variables with `NEXT_PUBLIC_` only when values must be available in the browser. Avoid exposing secrets.
- Store secrets in your platform's secret manager (Vercel, GitHub Actions secrets, Azure Key Vault etc.) for production.
- Add any additional env vars your deployment requires and document them here.
flowchart LR
  Browser[Browser (React)] -->|navigate| NextPages[Next.js pages]
  NextPages -->|calls| API_Route[/app/api/inngest/route.ts]
  API_Route -->|registers| Inngest[Inngest server]
  NextPages -->|server actions| AuthActions[lib/actions/auth.actions.ts]
  AuthActions -->|emits event| Inngest
  Inngest -->|invokes| Functions[lib/inngest/functions.ts]
  Functions -->|sends email| Mailer[lib/nodemailer/index.ts]
  NextPages -->|reads/writes| DB[(MongoDB via database/mongoose.ts)]
  DB --> Watchlist[watchlist collection]

