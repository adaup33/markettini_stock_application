# GitHub Copilot Instructions for Markettini Stock Application

This document provides guidance for GitHub Copilot when working on this repository.

## Technology Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.9.3
- **Database**: MongoDB (via Mongoose 8.19.2)
- **Authentication**: Better Auth 1.3.31
- **Styling**: Tailwind CSS 4
- **Testing**: Jest 30.2.0 with React Testing Library
- **UI Components**: Radix UI with custom components in `/components/ui`
- **Other**: Inngest for background jobs, Finnhub API for stock data

## Project Structure

```
app/                  # Next.js App Router pages and API routes
  api/               # API route handlers
  (auth)/            # Auth-related pages (sign-in, sign-up)
components/          # React components
  ui/               # Reusable UI components (shadcn/ui style)
  forms/            # Form components
lib/                 # Utility functions and actions
  actions/          # Server actions
  db/               # Database utilities
hooks/              # Custom React hooks
__tests__/          # Test files (mirrors source structure)
database/           # Database schemas and models
middleware/         # Next.js middleware
scripts/            # Utility scripts (DB setup, WebSocket server)
```

## Critical: Edge vs Node.js Runtime

**ALWAYS** be aware of Next.js runtime limitations:

### When to Use Node.js Runtime
Add `export const runtime = 'nodejs'` to any file that:
- Imports mongoose, mongodb, better-auth, or other Node-only libraries
- Uses Node.js core modules (fs, path, net, tls, crypto)
- Requires long-lived database connections

### When Edge is OK
- Simple data fetching with Web APIs
- Lightweight transformations
- Reading cookies or headers

### Important Files Already Using Node.js Runtime
- `app/api/db-check/route.ts`
- `app/(auth)/*/layout.tsx` files that import auth
- Any route handler that uses database connections

**NEVER** put database calls in `middleware.ts` - middleware always runs on Edge.

## Code Style and Conventions

### TypeScript
- Use strict TypeScript - all types must be defined
- Use `interface` for object types, `type` for unions/intersections
- Import types from `/types` directory when available
- Path alias: `@/*` maps to root directory

### React Components
- Use functional components with TypeScript
- Use React 19 features appropriately
- Client components: Add `"use client"` directive when needed
- Server components: Default for App Router, no directive needed
- Props: Define interfaces for all component props

### File Naming
- Components: PascalCase (e.g., `StockSymbolSearch.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- API routes: lowercase (e.g., `route.ts`)
- Tests: Match source file with `.test.ts` suffix

### Styling
- Use Tailwind CSS utility classes
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Follow existing component patterns in `components/ui`

## Testing Requirements

### Test Coverage Expectations
- Write tests for all new utility functions
- Write tests for all new server actions
- Write tests for new custom hooks
- API routes should have integration tests
- Current coverage: 91 tests, ~95% coverage - maintain or improve

### Testing Framework
- **Jest** with TypeScript support (ts-jest)
- **React Testing Library** for component tests
- Test files in `__tests__/` directory mirroring source structure

### Test Conventions
- Use descriptive test names: `it('should do X when Y happens')`
- Group related tests with `describe` blocks
- Mock external dependencies (DB, APIs, auth)
- Test both success and error paths
- Use `@jest-environment node` for server-side tests
- Add type assertions when needed: `as RawNewsArticle`

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run test:api       # API tests only
```

## Database and Authentication

### Database Connection
- Use `connectToDatabase()` from `lib/db/mongoose.ts`
- Connection is cached in `globalThis` to avoid reconnects
- Always use Node.js runtime for DB operations
- Models are in `database/` directory

### Authentication
- Better Auth is configured in `lib/auth.ts`
- Auth pages in `app/(auth)/` directory
- Use `export const runtime = 'nodejs'` in auth-related files
- Session management via Better Auth helpers

## API Development

### API Route Conventions
- Use Next.js 16 App Router API routes
- File: `app/api/[route]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Add `export const runtime = 'nodejs'` for DB/auth operations
- Return `Response` objects using `NextResponse`
- Handle errors gracefully with appropriate status codes

### External APIs
- Finnhub API for stock data (use actions in `lib/actions/finnhub.actions.ts`)
- Always handle API failures gracefully
- Use environment variables for API keys

## Build and Development

### Commands
```bash
npm run dev           # Development server (Turbopack)
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking
```

### Before Committing
1. Run tests: `npm test`
2. Run type check: `npm run typecheck`
3. Run linter: `npm run lint`
4. Ensure build succeeds: `npm run build`

## CI/CD

### GitHub Actions Workflow
- Runs on push/PR to main/master
- Steps: Install → Lint → Typecheck → Build → Test
- MongoDB service container for tests
- Lint and typecheck are non-blocking (continue-on-error)
- All tests must pass

### Environment Variables Required
- `MONGODB_URI`: MongoDB connection string
- `BETTER_AUTH_SECRET`: Auth secret key
- `BETTER_AUTH_URL`: Application URL
- `FINNHUB_API_KEY`: Finnhub API key (if using stock API)

## Common Patterns

### Server Actions
- Located in `lib/actions/`
- Use `"use server"` directive
- Return consistent response format
- Handle errors with try-catch
- Always use Node.js runtime

### Data Fetching
- Prefer Server Components for data fetching
- Use React 19 `use` hook for promises when appropriate
- Cache data appropriately with Next.js caching

### Error Handling
- Use try-catch blocks
- Log errors appropriately
- Return user-friendly error messages
- Use `console.error` for debugging

## Documentation

### When to Update Docs
- Update README.md for major features or setup changes
- Update TESTING.md when adding new test conventions
- Update this file when adding new conventions or patterns
- Add JSDoc comments for complex functions

## Best Practices

1. **Minimal Changes**: Make the smallest possible changes to achieve the goal
2. **Type Safety**: Never use `any` - always define proper types
3. **Error Handling**: Always handle potential errors
4. **Testing**: Write tests for new functionality
5. **Runtime Awareness**: Always specify runtime for Node-dependent code
6. **Code Reuse**: Check for existing utilities before creating new ones
7. **Consistency**: Follow existing patterns in the codebase
8. **Performance**: Consider performance implications, especially for DB queries
9. **Security**: Never commit secrets, validate user inputs
10. **Accessibility**: Follow accessibility best practices for UI components

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Better Auth Docs](https://www.better-auth.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## Questions?

Refer to existing code patterns and documentation in:
- `README.md` - Setup and runtime information
- `TESTING.md` - Testing conventions
- `.github/workflows/ci.yml` - CI/CD setup
- Existing components and utilities for code patterns
