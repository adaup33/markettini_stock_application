/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/alerts/route';

// Mock the dependencies
jest.mock('@/database/mongoose', () => ({
  connectToDb: jest.fn(),
}));

jest.mock('@/database/models/alert.model', () => ({
  Alert: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/lib/better-auth/auth', () => ({
  auth: null,
}));

import { connectToDb } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';

describe('Alerts API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.NODEMAILER_EMAIL;
    delete process.env.DEV_WATCHLIST_EMAIL;
    delete process.env.NEXT_PUBLIC_DEV_EMAIL;
    delete process.env.NODE_ENV;
  });

  describe('GET /api/alerts', () => {
    it('should return alerts for a valid user', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockAlerts = [
        { userId: 'user123', symbol: 'AAPL', operator: '>', threshold: 150, active: true, createdAt: new Date() }
      ];
      
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
          countDocuments: jest.fn().mockResolvedValue(1),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Alert.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAlerts),
      });

      const request = new NextRequest('http://localhost:3000/api/alerts?email=test@example.com');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].symbol).toBe('AAPL');
    });

    it('should return empty array when user not found', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const request = new NextRequest('http://localhost:3000/api/alerts?email=notfound@example.com');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should filter alerts by symbol when provided', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockAlerts = [
        { userId: 'user123', symbol: 'AAPL', operator: '>', threshold: 150, active: true, createdAt: new Date() }
      ];
      
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
          countDocuments: jest.fn().mockResolvedValue(1),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Alert.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAlerts),
      });

      const request = new NextRequest('http://localhost:3000/api/alerts?email=test@example.com&symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Alert.find).toHaveBeenCalledWith({ userId: 'user123', symbol: 'AAPL' });
    });

    it('should handle database errors gracefully', async () => {
      (connectToDb as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/alerts?email=test@example.com');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/alerts', () => {
    it('should create alert with valid data', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockCreatedAlert = {
        _id: 'alert123',
        userId: 'user123',
        symbol: 'AAPL',
        operator: '>',
        threshold: 150,
        active: true,
        createdAt: new Date(),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Alert.create as jest.Mock).mockResolvedValue(mockCreatedAlert);

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          symbol: 'AAPL',
          operator: '>',
          threshold: 150,
          note: 'Test alert'
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe('AAPL');
      expect(Alert.create).toHaveBeenCalledWith({
        userId: 'user123',
        symbol: 'AAPL',
        operator: '>',
        threshold: 150,
        active: true,
        note: 'Test alert',
        createdAt: expect.any(Date),
      });
    });

    it('should return 400 when user not found', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'notfound@example.com',
          symbol: 'AAPL',
          operator: '>',
          threshold: 150
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('user not found');
      expect(Alert.create).not.toHaveBeenCalled();
    });

    it('should return 400 when symbol is missing', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          operator: '>',
          threshold: 150
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid payload');
      expect(Alert.create).not.toHaveBeenCalled();
    });

    it('should return 400 when operator is missing', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          symbol: 'AAPL',
          threshold: 150
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid payload');
    });

    it('should return 400 when threshold is missing', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          symbol: 'AAPL',
          operator: '>'
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid payload');
    });

    it('should normalize symbol to uppercase', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockCreatedAlert = {
        _id: 'alert123',
        userId: 'user123',
        symbol: 'AAPL',
        operator: '>',
        threshold: 150,
        active: true,
        createdAt: new Date(),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Alert.create as jest.Mock).mockResolvedValue(mockCreatedAlert);

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          symbol: 'aapl',
          operator: '>',
          threshold: 150
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(Alert.create).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'AAPL' })
      );
    });

    it('should use dev fallback email in non-production environment', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_WATCHLIST_EMAIL = 'dev@example.com';
      
      const mockUser = { id: 'user123', email: 'dev@example.com' };
      const mockCreatedAlert = {
        _id: 'alert123',
        userId: 'user123',
        symbol: 'AAPL',
        operator: '>',
        threshold: 150,
        active: true,
        createdAt: new Date(),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Alert.create as jest.Mock).mockResolvedValue(mockCreatedAlert);

      const request = new NextRequest('http://localhost:3000/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          symbol: 'AAPL',
          operator: '>',
          threshold: 150
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('Runtime Configuration', () => {
    it('should export nodejs runtime', () => {
      const routeModule = require('@/app/api/alerts/route');
      expect(routeModule.runtime).toBe('nodejs');
    });
  });
});
