// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock better-auth to avoid top-level await issues
jest.mock('@/lib/better-auth/auth', () => ({
  getAuth: jest.fn().mockResolvedValue({
    api: {},
    handler: jest.fn(),
  }),
  auth: {
    api: {},
    handler: jest.fn(),
  },
}));

