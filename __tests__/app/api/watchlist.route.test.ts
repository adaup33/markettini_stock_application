/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/watchlist/route';

// Mock the dependencies
jest.mock('@/lib/actions/watchlist.actions', () => ({
  getWatchlistByEmail: jest.fn(),
  addSymbolToWatchlist: jest.fn(),
  removeSymbolFromWatchlist: jest.fn(),
}));

jest.mock('@/lib/better-auth/auth', () => ({
  auth: null,
}));

jest.mock('@/lib/actions/finnhub.actions', () => ({
  getQuotes: jest.fn(),
}));

import { getWatchlistByEmail, addSymbolToWatchlist, removeSymbolFromWatchlist } from '@/lib/actions/watchlist.actions';
import { getQuotes } from '@/lib/actions/finnhub.actions';

describe('Watchlist API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.NODEMAILER_EMAIL;
    delete process.env.DEV_WATCHLIST_EMAIL;
    delete process.env.NEXT_PUBLIC_DEV_EMAIL;
    delete process.env.NODE_ENV;
  });

  describe('GET /api/watchlist', () => {
    it('should return watchlist items with email from query parameter', async () => {
      const mockItems = [
        { symbol: 'AAPL', company: 'Apple Inc.', userId: 'user123', addedAt: new Date() }
      ];
      (getWatchlistByEmail as jest.Mock).mockResolvedValue(mockItems);
      (getQuotes as jest.Mock).mockResolvedValue({
        'AAPL': { price: '150.00', change: '+2.50', percent: '+1.69%' }
      });

      const request = new NextRequest('http://localhost:3000/api/watchlist?email=test@example.com');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(getWatchlistByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return watchlist items with email from header', async () => {
      const mockItems = [
        { symbol: 'MSFT', company: 'Microsoft', userId: 'user456', addedAt: new Date() }
      ];
      (getWatchlistByEmail as jest.Mock).mockResolvedValue(mockItems);
      (getQuotes as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/watchlist', {
        headers: { 'x-user-email': 'header@example.com' }
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(getWatchlistByEmail).toHaveBeenCalledWith('header@example.com');
    });

    it('should use NODEMAILER_EMAIL fallback in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NODEMAILER_EMAIL = 'nodemailer@example.com';
      (getWatchlistByEmail as jest.Mock).mockResolvedValue([]);
      (getQuotes as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/watchlist');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(getWatchlistByEmail).toHaveBeenCalledWith('nodemailer@example.com');
      expect(data.meta.emailSource).toBe('nodemailer_env');
    });

    it('should handle errors gracefully', async () => {
      (getWatchlistByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/watchlist?email=test@example.com');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/watchlist', () => {
    it('should add symbol to watchlist with valid email and symbol', async () => {
      (addSymbolToWatchlist as jest.Mock).mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          symbol: 'AAPL',
          company: 'Apple Inc.'
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(addSymbolToWatchlist).toHaveBeenCalledWith(
        'test@example.com',
        'AAPL',
        'Apple Inc.',
        expect.any(Object)
      );
    });

    it('should return 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          symbol: 'AAPL',
          company: 'Apple Inc.'
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing email');
      expect(addSymbolToWatchlist).not.toHaveBeenCalled();
    });

    it('should return 400 when symbol is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          company: 'Apple Inc.'
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing symbol');
      expect(addSymbolToWatchlist).not.toHaveBeenCalled();
    });

    it('should use dev fallback email in non-production environment', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_WATCHLIST_EMAIL = 'dev@example.com';
      (addSymbolToWatchlist as jest.Mock).mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          symbol: 'AAPL',
          company: 'Apple Inc.'
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(addSymbolToWatchlist).toHaveBeenCalledWith(
        'dev@example.com',
        'AAPL',
        'Apple Inc.',
        expect.any(Object)
      );
    });

    it('should handle action function errors', async () => {
      (addSymbolToWatchlist as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'User not found' 
      });

      const request = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          symbol: 'AAPL',
          company: 'Apple Inc.'
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });

    it('should handle numeric fields (marketCapB, peRatio, alertPrice)', async () => {
      (addSymbolToWatchlist as jest.Mock).mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost:3000/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          symbol: 'AAPL',
          company: 'Apple Inc.',
          marketCapB: 2.5,
          peRatio: 25.5,
          alertPrice: 150.00
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(addSymbolToWatchlist).toHaveBeenCalledWith(
        'test@example.com',
        'AAPL',
        'Apple Inc.',
        {
          marketCapB: 2.5,
          peRatio: 25.5,
          alertPrice: 150.00
        }
      );
    });
  });

  describe('DELETE /api/watchlist', () => {
    it('should delete symbol from watchlist with valid email and symbol', async () => {
      (removeSymbolFromWatchlist as jest.Mock).mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost:3000/api/watchlist?email=test@example.com&symbol=AAPL', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(removeSymbolFromWatchlist).toHaveBeenCalledWith('test@example.com', 'AAPL');
    });

    it('should return 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/watchlist?symbol=AAPL', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing email');
      expect(removeSymbolFromWatchlist).not.toHaveBeenCalled();
    });

    it('should return 400 when symbol is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/watchlist?email=test@example.com', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing symbol');
      expect(removeSymbolFromWatchlist).not.toHaveBeenCalled();
    });

    it('should handle action function errors', async () => {
      (removeSymbolFromWatchlist as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'Symbol not found' 
      });

      const request = new NextRequest('http://localhost:3000/api/watchlist?email=test@example.com&symbol=AAPL', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Symbol not found');
    });
  });

  describe('Runtime Configuration', () => {
    it('should export nodejs runtime', () => {
      // Import the runtime export
      const routeModule = require('@/app/api/watchlist/route');
      expect(routeModule.runtime).toBe('nodejs');
    });
  });
});
