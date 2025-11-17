/**
 * @jest-environment node
 */
import { signUpWithEmail, signInWithEmail, signOut } from '@/lib/actions/auth.actions';

// Mock the auth module
jest.mock('@/lib/better-auth/auth', () => ({
  getAuth: jest.fn(),
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

import { getAuth } from '@/lib/better-auth/auth';
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

      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockResolvedValue(mockResponse),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);
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
      expect(mockAuth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
        headers: {},
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
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockRejectedValue(new Error('Sign up failed')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

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
      expect(result.error).toBe('Failed to create account. Please try again.');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should handle user already exists error', async () => {
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockRejectedValue(new Error('User already exists')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const formData: SignUpFormData = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists. Please sign in instead.');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should handle email-related errors', async () => {
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockRejectedValue(new Error('Invalid email format')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const formData: SignUpFormData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should send inngest event even if sign up response is null (autoSignIn disabled)', async () => {
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockResolvedValue(null),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);
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
      // Event should be sent even when response is null (autoSignIn disabled)
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

    it('should handle error response from Better Auth (error object instead of exception)', async () => {
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockResolvedValue({
            error: { message: 'User already exists' }
          }),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const formData: SignUpFormData = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists. Please sign in instead.');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should succeed even when Inngest event fails (non-blocking)', async () => {
      const mockResponse = {
        user: { id: 'user123', email: 'test@example.com', name: 'Test User' },
      };

      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockResolvedValue(mockResponse),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);
      // Simulate Inngest send failure
      (inngest.send as jest.Mock).mockRejectedValue(new Error('Inngest service unavailable'));

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

      // Sign up should still succeed even though Inngest failed
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(inngest.send).toHaveBeenCalled();
    });
  });

  describe('signInWithEmail', () => {
    it('should successfully sign in a user', async () => {
      const mockResponse = {
        user: { id: 'user123', email: 'test@example.com' },
        session: { id: 'session123' },
      };

      const mockAuth = {
        api: {
          signInEmail: jest.fn().mockResolvedValue(mockResponse),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const formData: SignInFormData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await signInWithEmail(formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockAuth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: {},
      });
    });

    it('should handle sign in failure', async () => {
      const mockAuth = {
        api: {
          signInEmail: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const formData: SignInFormData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const result = await signInWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign in failed');
    });

    it('should handle network errors during sign in', async () => {
      const mockAuth = {
        api: {
          signInEmail: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

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
      const mockAuth = {
        api: {
          signOut: jest.fn().mockResolvedValue(undefined),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const result = await signOut();

      expect(result).toBeUndefined();
      expect(mockAuth.api.signOut).toHaveBeenCalled();
    });

    it('should handle sign out failure', async () => {
      const mockAuth = {
        api: {
          signOut: jest.fn().mockRejectedValue(new Error('Sign out failed')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const result = await signOut();

      expect(result).toEqual({
        success: false,
        error: 'Sign out failed',
      });
    });

    it('should pass headers to signOut API', async () => {
      const mockAuth = {
        api: {
          signOut: jest.fn().mockResolvedValue(undefined),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      await signOut();

      expect(mockAuth.api.signOut).toHaveBeenCalledWith({
        headers: {},
      });
    });
  });
});
