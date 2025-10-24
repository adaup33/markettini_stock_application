# Test Suite Documentation

This project includes comprehensive tests for all implementations and functions to ensure core functionality, error handling, and edge cases work as expected.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (useful during development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

Tests are organized in the `__tests__` directory following the same structure as the source code:

```
__tests__/
├── hooks/
│   └── useDebounce.test.ts
└── lib/
    ├── actions/
    │   ├── auth.actions.test.ts
    │   ├── finnhub.actions.test.ts
    │   ├── user.actions.test.ts
    │   └── watchlist.actions.test.ts
    └── utils.test.ts
```

## Test Coverage

The test suite covers:

### Utility Functions (`lib/utils.ts`)
- **20 tests** covering:
  - `cn()` - Class name merging
  - `formatTimeAgo()` - Time formatting
  - `delay()` - Async delay function
  - `formatMarketCapValue()` - Market cap formatting
  - `getDateRange()` - Date range calculation
  - `getTodayDateRange()` - Today's date range
  - `calculateNewsDistribution()` - News distribution logic
  - `validateArticle()` - Article validation
  - `getTodayString()` - Today's date string
  - `formatArticle()` - Article formatting
  - `formatChangePercent()` - Percentage change formatting
  - `getChangeColorClass()` - Color class selection
  - `formatPrice()` - Price formatting
  - `getAlertText()` - Alert text generation

### Hook Tests (`hooks/useDebounce.ts`)
- **6 tests** covering:
  - Basic debouncing functionality
  - Cancellation of previous timeouts
  - Different delay configurations
  - Callback updates
  - Rapid successive calls

### Action Tests (`lib/actions/`)

#### Auth Actions (`auth.actions.ts`)
- **9 tests** covering:
  - `signUpWithEmail()` - User registration
  - `signInWithEmail()` - User authentication
  - `signOut()` - User logout
  - Error handling for all auth operations

#### Finnhub Actions (`finnhub.actions.ts`)
- **19 tests** covering:
  - `fetchJSON()` - API data fetching
  - `getNews()` - News retrieval
  - `searchStocks()` - Stock search functionality
  - Error handling and edge cases
  - API response formatting

#### User Actions (`user.actions.ts`)
- **12 tests** covering:
  - `getAllUsersForNewsEmail()` - User data retrieval
  - Filtering logic
  - Database error handling
  - Edge cases

#### Watchlist Actions (`watchlist.actions.ts`)
- **10 tests** covering:
  - `getWatchlistSymbolsByEmail()` - Watchlist retrieval
  - User lookup
  - Error handling
  - Symbol conversion

## Coverage Statistics

Current test coverage:
- **lib/utils.ts**: 98.7%
- **lib/actions/auth.actions.ts**: 100%
- **lib/actions/user.actions.ts**: 100%
- **lib/actions/watchlist.actions.ts**: 100%
- **lib/actions/finnhub.actions.ts**: 88.5%
- **hooks/useDebounce.ts**: 100%

**Total: 91 tests, all passing ✓**

## Test Framework

This project uses:
- **Jest** - Testing framework
- **@testing-library/react** - React testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers
- **ts-jest** - TypeScript support for Jest

## Writing New Tests

When adding new functionality:

1. Create a test file in the corresponding `__tests__` directory
2. Follow the naming convention: `filename.test.ts`
3. Use descriptive test names with `describe` and `it` blocks
4. Mock external dependencies appropriately
5. Test both success and error cases
6. Run tests to ensure they pass

Example:
```typescript
describe('MyFunction', () => {
  it('should do something expected', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
  
  it('should handle errors gracefully', () => {
    expect(() => myFunction(badInput)).toThrow();
  });
});
```

## Continuous Integration

Tests are automatically run as part of the CI/CD pipeline to ensure code quality before deployment.

## Troubleshooting

### Tests failing locally
- Ensure all dependencies are installed: `npm install`
- Clear Jest cache: `npm test -- --clearCache`
- Check for environment variable requirements

### Coverage not updating
- Delete the `coverage` directory: `rm -rf coverage`
- Run coverage again: `npm run test:coverage`

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

### Project Testing Conventions

This project follows these testing conventions:
- Use descriptive test names that explain the expected behavior
- Group related tests using `describe` blocks
- Mock external dependencies (database, API calls, auth)
- Test both success and failure paths
- Use `as RawNewsArticle` or similar type assertions to avoid linting errors
- Add `@jest-environment node` comment for server-side tests
- Keep test files organized to mirror source code structure
