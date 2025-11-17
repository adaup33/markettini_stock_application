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
      expect(result.error).toBe('Sign up failed. Please try again.');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should provide specific error message for duplicate email', async () => {
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockRejectedValue(new Error('User with this email already exists')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const formData: SignUpFormData = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('This email is already registered. Please use a different email or sign in.');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should provide specific error message for password validation', async () => {
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockRejectedValue(new Error('Password must be at least 8 characters')),
        },
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const formData: SignUpFormData = {
        email: 'test@example.com',
        password: 'short',
        fullName: 'Test User',
        country: 'USA',
        investmentGoals: 'Growth',
        riskTolerance: 'Medium',
        preferredIndustry: 'Technology',
      };

      const result = await signUpWithEmail(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password does not meet requirements. Please use at least 8 characters.');
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should not send inngest event if sign up response is null', async () => {
      const mockAuth = {
        api: {
          signUpEmail: jest.fn().mockResolvedValue(null),
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
      expect(result.error).toBe('Invalid email or password. Please try again.');
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
      expect(result.error).toBe('Sign in failed. Please try again.');
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
        error: 'Sign out failed. Please try again.',
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
