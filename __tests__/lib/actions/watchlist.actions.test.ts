/**
 * @jest-environment node
 */
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';

// Mock the database connection
jest.mock('@/database/mongoose', () => ({
  connectToDb: jest.fn(),
}));

// Mock the Watchlist model
jest.mock('@/database/models/watchlist.model', () => ({
  Watchlist: {
    find: jest.fn(),
  },
}));

import { connectToDb } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

describe('Watchlist Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWatchlistSymbolsByEmail', () => {
    it('should return empty array when email is not provided', async () => {
      const result = await getWatchlistSymbolsByEmail('');
      expect(result).toEqual([]);
    });

    it('should return empty array when user is not found', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getWatchlistSymbolsByEmail('nonexistent@example.com');
      expect(result).toEqual([]);
    });

    it('should return watchlist symbols for valid user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
      };

      const mockWatchlistItems = [
        { symbol: 'AAPL' },
        { symbol: 'MSFT' },
        { symbol: 'GOOGL' },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Watchlist.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockWatchlistItems),
      });

      const result = await getWatchlistSymbolsByEmail('test@example.com');
      expect(result).toEqual(['AAPL', 'MSFT', 'GOOGL']);
      expect(Watchlist.find).toHaveBeenCalledWith(
        { userId: 'user123' },
        { symbol: 1 }
      );
    });

    it('should handle user with _id instead of id', async () => {
      const mockUser = {
        _id: 'user456',
        email: 'test2@example.com',
      };

      const mockWatchlistItems = [{ symbol: 'TSLA' }];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Watchlist.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockWatchlistItems),
      });

      const result = await getWatchlistSymbolsByEmail('test2@example.com');
      expect(result).toEqual(['TSLA']);
    });

    it('should return empty array when userId is not found', async () => {
      const mockUser = {
        email: 'test@example.com',
        // no id or _id
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getWatchlistSymbolsByEmail('test@example.com');
      expect(result).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      (connectToDb as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await getWatchlistSymbolsByEmail('test@example.com');
      expect(result).toEqual([]);
    });

    it('should handle errors when database is null', async () => {
      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: null },
      });

      const result = await getWatchlistSymbolsByEmail('test@example.com');
      expect(result).toEqual([]);
    });

    it('should handle Watchlist.find errors', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Watchlist.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database query failed')),
      });

      const result = await getWatchlistSymbolsByEmail('test@example.com');
      expect(result).toEqual([]);
    });

    it('should convert symbols to strings', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
      };

      const mockWatchlistItems = [
        { symbol: 123 }, // non-string symbol
        { symbol: 'AAPL' },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      (Watchlist.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockWatchlistItems),
      });

      const result = await getWatchlistSymbolsByEmail('test@example.com');
      expect(result).toEqual(['123', 'AAPL']);
      expect(typeof result[0]).toBe('string');
    });
  });
});
