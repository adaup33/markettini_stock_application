/**
 * @jest-environment node
 */
import { fetchJSON, getNews, searchStocks } from '@/lib/actions/finnhub.actions';
import { validateArticle, formatArticle } from '@/lib/utils';

// Mock global fetch
global.fetch = jest.fn();

describe('Finnhub Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variable for tests
    process.env.NEXT_PUBLIC_FINNHUB_API_KEY = 'test-api-key';
    process.env.FINNHUB_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchJSON', () => {
    it('should fetch and parse JSON successfully', async () => {
      const mockData = { test: 'data' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchJSON('https://example.com/api');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api',
        { cache: 'no-store' }
      );
    });

    it('should use cache when revalidateSeconds is provided', async () => {
      const mockData = { test: 'data' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await fetchJSON('https://example.com/api', 300);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api',
        { cache: 'force-cache', next: { revalidate: 300 } }
      );
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(fetchJSON('https://example.com/api')).rejects.toThrow(
        'Fetch failed 404: Not Found'
      );
    });

    it('should handle fetch error without text', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => {
          throw new Error('Cannot read text');
        },
      });

      await expect(fetchJSON('https://example.com/api')).rejects.toThrow(
        'Fetch failed 500'
      );
    });
  });

  describe('getNews', () => {
    it('should fetch general news when no symbols provided', async () => {
      const mockNews = [
        {
          id: 1,
          headline: 'Test News 1',
          summary: 'Summary 1',
          url: 'https://example.com/1',
          datetime: 1234567890,
          category: 'general',
          source: 'Test Source',
        },
        {
          id: 2,
          headline: 'Test News 2',
          summary: 'Summary 2',
          url: 'https://example.com/2',
          datetime: 1234567891,
          category: 'general',
          source: 'Test Source',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      });

      const result = await getNews();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('headline');
      expect(result[0]).toHaveProperty('summary');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should fetch company news for provided symbols', async () => {
      const mockCompanyNews = [
        {
          id: 1,
          headline: 'Apple News',
          summary: 'Apple summary',
          url: 'https://example.com/apple',
          datetime: 1234567890,
          source: 'Test Source',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCompanyNews,
      });

      const result = await getNews(['AAPL']);
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle empty symbols array', async () => {
      const mockNews = [
        {
          id: 1,
          headline: 'General News',
          summary: 'General summary',
          url: 'https://example.com/general',
          datetime: 1234567890,
          category: 'general',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      });

      const result = await getNews([]);
      expect(result).toBeDefined();
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getNews()).rejects.toThrow('Failed to fetch news');
    });

    it('should limit results to 6 articles', async () => {
      const mockNews = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        headline: `News ${i}`,
        summary: `Summary ${i}`,
        url: `https://example.com/${i}`,
        datetime: 1234567890 + i,
        category: 'general',
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNews,
      });

      const result = await getNews();
      expect(result.length).toBeLessThanOrEqual(6);
    });
  });

  describe('searchStocks', () => {
    it('should return popular stocks when no query provided', async () => {
      const mockProfile = {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        exchange: 'NASDAQ',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await searchStocks();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should search stocks with query', async () => {
      const mockSearchResult = {
        count: 2,
        result: [
          {
            symbol: 'AAPL',
            description: 'Apple Inc.',
            displaySymbol: 'AAPL',
            type: 'Common Stock',
          },
          {
            symbol: 'MSFT',
            description: 'Microsoft Corporation',
            displaySymbol: 'MSFT',
            type: 'Common Stock',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      const result = await searchStocks('apple');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('symbol');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('isInWatchlist');
    });

    it('should handle empty search query', async () => {
      const mockProfile = {
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await searchStocks('');
      expect(result).toBeDefined();
    });

    it('should return empty array on error when no API key', async () => {
      delete process.env.FINNHUB_API_KEY;
      delete process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

      const result = await searchStocks('test');
      expect(result).toEqual([]);

      // Restore for other tests
      process.env.NEXT_PUBLIC_FINNHUB_API_KEY = 'test-api-key';
      process.env.FINNHUB_API_KEY = 'test-api-key';
    });

    it('should limit results to 15 items', async () => {
      const mockSearchResult = {
        count: 50,
        result: Array.from({ length: 50 }, (_, i) => ({
          symbol: `SYM${i}`,
          description: `Company ${i}`,
          displaySymbol: `SYM${i}`,
          type: 'Common Stock',
        })),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      const result = await searchStocks('test');
      expect(result.length).toBeLessThanOrEqual(15);
    });

    it('should convert symbols to uppercase', async () => {
      const mockSearchResult = {
        count: 1,
        result: [
          {
            symbol: 'aapl',
            description: 'Apple Inc.',
            displaySymbol: 'aapl',
            type: 'Common Stock',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      const result = await searchStocks('aapl');
      expect(result[0].symbol).toBe('AAPL');
    });

    it('should set isInWatchlist to false by default', async () => {
      const mockSearchResult = {
        count: 1,
        result: [
          {
            symbol: 'AAPL',
            description: 'Apple Inc.',
            displaySymbol: 'AAPL',
            type: 'Common Stock',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
      });

      const result = await searchStocks('apple');
      expect(result[0].isInWatchlist).toBe(false);
    });
  });
});
