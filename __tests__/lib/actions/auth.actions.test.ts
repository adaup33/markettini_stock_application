/**
 * @jest-environment node
 */
import { signUpWithEmail, signInWithEmail, signOut } from '@/lib/actions/auth.actions';

// Mock the auth module
jest.mock('@/lib/better-auth/auth', () => ({
  auth: {
    api: {
      signUpEmail: jest.fn(),
      signInEmail: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock the inngest client
jest.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: jest.fn(),
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({}),
}));

import { auth } from '@/lib/better-auth/auth';
import { inngest } from '@/lib/inngest/client';

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpWithEmail', () => {
    it('should successfully sign up a user', async () => {
      const mockResponse = {
        user: { id: 'user123', email: 'test@example.com', name: 'Test User' },
      };

      (auth.api.signUpEmail as unknown as jest.Mock).mockResolvedValue(mockResponse);
      (inngest.send as jest.Mock).mockResolvedValue({ ids: ['event123'] });

      const formData: SignUpFormData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
      });
      expect(inngest.send).toHaveBeenCalledWith({
        name: 'app/user.created',
        data: {
          email: 'test@example.com',
          name: 'Test User',
          country: 'USA',
          investmentGoals: 'Growth',
          riskTolerance: 'Medium',
          preferredIndustry: 'Technology',
        },
      });
    });

    it('should handle sign up failure', async () => {
      (auth.api.signUpEmail as unknown as jest.Mock).mockRejectedValue(new Error('Sign up failed'));

      const formData: SignUpFormData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign up failed');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should not send inngest event if sign up response is null', async () => {
      (auth.api.signUpEmail as unknown as jest.Mock).mockResolvedValue(null);

      const formData: SignUpFormData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(true);
      expect(inngest.send).not.toHaveBeenCalled();
    });
  });

  describe('signInWithEmail', () => {
    it('should successfully sign in a user', async () => {
      const mockResponse = {
        user: { id: 'user123', email: 'test@example.com' },
        session: { id: 'session123' },
      };

      (auth.api.signInEmail as unknown as jest.Mock).mockResolvedValue(mockResponse);

      const formData: SignInFormData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await signInWithEmail(formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });
    });

    it('should handle sign in failure', async () => {
      (auth.api.signInEmail as unknown as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const formData: SignInFormData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const result = await signInWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign in failed');
    });

    it('should handle network errors during sign in', async () => {
      (auth.api.signInEmail as unknown as jest.Mock).mockRejectedValue(new Error('Network error'));

      const formData: SignInFormData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await signInWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign in failed');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      (auth.api.signOut as unknown as jest.Mock).mockResolvedValue(undefined);

      const result = await signOut();

      expect(result).toBeUndefined();
      expect(auth.api.signOut).toHaveBeenCalled();
    });

    it('should handle sign out failure', async () => {
      (auth.api.signOut as unknown as jest.Mock).mockRejectedValue(new Error('Sign out failed'));

      const result = await signOut();

      expect(result).toEqual({
        success: false,
        error: 'Sign out failed',
      });
    });

    it('should pass headers to signOut API', async () => {
      (auth.api.signOut as unknown as jest.Mock).mockResolvedValue(undefined);

      await signOut();

      expect(auth.api.signOut).toHaveBeenCalledWith({
        headers: {},
      });
    });
  });
});
