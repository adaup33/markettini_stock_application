/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/auth/[...all]/route';
import { getAuth } from '@/lib/better-auth/auth';
import { NextRequest } from 'next/server';

// Mock the auth module
jest.mock('@/lib/better-auth/auth', () => ({
  getAuth: jest.fn(),
}));

describe('Better Auth API Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET handler', () => {
    it('should call auth.handler with the request', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const mockAuth = {
        handler: mockHandler,
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const mockRequest = new NextRequest('http://localhost:3000/api/auth/session');

      const response = await GET(mockRequest);

      expect(getAuth).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should handle errors from getAuth', async () => {
      (getAuth as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const mockRequest = new NextRequest('http://localhost:3000/api/auth/session');

      await expect(GET(mockRequest)).rejects.toThrow('Database connection failed');
    });
  });

  describe('POST handler', () => {
    it('should call auth.handler with the request for sign-up', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: { id: '123', email: 'test@example.com' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const mockAuth = {
        handler: mockHandler,
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const mockRequest = new NextRequest('http://localhost:3000/api/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      });

      const response = await POST(mockRequest);

      expect(getAuth).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should call auth.handler with the request for sign-in', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: { id: '123' }, session: { id: 'session123' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const mockAuth = {
        handler: mockHandler,
      };

      (getAuth as jest.Mock).mockResolvedValue(mockAuth);

      const mockRequest = new NextRequest('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(mockRequest);

      expect(getAuth).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should handle errors from getAuth', async () => {
      (getAuth as jest.Mock).mockRejectedValue(new Error('Auth initialization failed'));

      const mockRequest = new NextRequest('http://localhost:3000/api/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      });

      await expect(POST(mockRequest)).rejects.toThrow('Auth initialization failed');
    });
  });
});
