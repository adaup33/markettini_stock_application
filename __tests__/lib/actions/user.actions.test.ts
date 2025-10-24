/**
 * @jest-environment node
 */
import { getAllUsersForNewsEmail } from '@/lib/actions/user.actions';

// Mock the database connection
jest.mock('@/database/mongoose', () => ({
  connectToDb: jest.fn(),
}));

import { connectToDb } from '@/database/mongoose';

describe('User Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsersForNewsEmail', () => {
    it('should return users with email and name', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          country: 'USA',
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          country: 'UK',
        },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user1',
        email: 'user1@example.com',
        name: 'User One',
      });
      expect(result[1]).toEqual({
        id: 'user2',
        email: 'user2@example.com',
        name: 'User Two',
      });
    });

    it('should filter out users without email', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
        },
        {
          id: 'user2',
          email: null,
          name: 'User Two',
        },
        {
          id: 'user3',
          name: 'User Three',
        },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('user1@example.com');
    });

    it('should filter out users without name', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: null,
        },
        {
          id: 'user3',
          email: 'user3@example.com',
        },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User One');
    });

    it('should use _id when id is not available', async () => {
      const mockUsers = [
        {
          _id: { toString: () => 'objectid123' },
          email: 'user1@example.com',
          name: 'User One',
        },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('objectid123');
    });

    it('should handle empty user list', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toEqual([]);
    });

    it('should return empty array when database connection is null', async () => {
      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: null },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      (connectToDb as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toEqual([]);
    });

    it('should handle database query errors', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockRejectedValue(new Error('Query failed')),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toEqual([]);
    });

    it('should query correct collection with proper filters', async () => {
      const mockFind = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      const mockCollection = jest.fn().mockReturnValue({
        find: mockFind,
      });

      const mockDb = {
        collection: mockCollection,
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      await getAllUsersForNewsEmail();

      expect(mockCollection).toHaveBeenCalledWith('user');
      expect(mockFind).toHaveBeenCalledWith(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      );
    });

    it('should handle users with both id and _id', async () => {
      const mockUsers = [
        {
          id: 'user1',
          _id: { toString: () => 'objectid123' },
          email: 'user1@example.com',
          name: 'User One',
        },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toHaveLength(1);
      // Should prefer id over _id
      expect(result[0].id).toBe('user1');
    });

    it('should handle empty string as id fallback', async () => {
      const mockUsers = [
        {
          email: 'user1@example.com',
          name: 'User One',
          // no id or _id
        },
      ];

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockUsers),
          }),
        }),
      };

      (connectToDb as jest.Mock).mockResolvedValue({
        connection: { db: mockDb },
      });

      const result = await getAllUsersForNewsEmail();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('');
    });
  });
});
