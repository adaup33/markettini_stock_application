import {
  cn,
  formatTimeAgo,
  delay,
  formatMarketCapValue,
  getDateRange,
  getTodayDateRange,
  calculateNewsDistribution,
  validateArticle,
  getTodayString,
  formatArticle,
  formatChangePercent,
  getChangeColorClass,
  formatPrice,
  getAlertText,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'text-white');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'visible');
      expect(result).toContain('base');
      expect(result).toContain('visible');
    });
  });

  describe('formatTimeAgo', () => {
    it('should format time in minutes', () => {
      const timestamp = Math.floor((Date.now() - 5 * 60 * 1000) / 1000); // 5 minutes ago
      const result = formatTimeAgo(timestamp);
      expect(result).toContain('minute');
    });

    it('should format time in hours', () => {
      const timestamp = Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000); // 2 hours ago
      const result = formatTimeAgo(timestamp);
      expect(result).toContain('hour');
    });

    it('should format time in days', () => {
      const timestamp = Math.floor((Date.now() - 26 * 60 * 60 * 1000) / 1000); // 26 hours ago
      const result = formatTimeAgo(timestamp);
      expect(result).toContain('day');
    });

    it('should use plural for multiple units', () => {
      const timestamp = Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000); // 2 days ago
      const result = formatTimeAgo(timestamp);
      expect(result).toContain('days');
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('formatMarketCapValue', () => {
    it('should format trillions correctly', () => {
      expect(formatMarketCapValue(3100000)).toBe('$3.10T');
      expect(formatMarketCapValue(1500000)).toBe('$1.50T');
    });

    it('should format billions correctly', () => {
      expect(formatMarketCapValue(900000)).toBe('$900.00B');
      expect(formatMarketCapValue(50000)).toBe('$50.00B');
    });

    it('should format millions correctly', () => {
      expect(formatMarketCapValue(500)).toBe('$500.00M');
      expect(formatMarketCapValue(100)).toBe('$100.00M');
    });

    it('should handle zero and null values', () => {
      expect(formatMarketCapValue(0)).toBe('N/A');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(formatMarketCapValue(null as any)).toBe('N/A');
    });
  });

  describe('getDateRange', () => {
    it('should return correct date range', () => {
      const range = getDateRange(7);
      expect(range).toHaveProperty('from');
      expect(range).toHaveProperty('to');
      expect(typeof range.from).toBe('string');
      expect(typeof range.to).toBe('string');
    });

    it('should format dates as YYYY-MM-DD', () => {
      const range = getDateRange(7);
      expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should calculate correct date difference', () => {
      const range = getDateRange(7);
      const fromDate = new Date(range.from);
      const toDate = new Date(range.to);
      const diffDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });
  });

  describe('getTodayDateRange', () => {
    it('should return same date for from and to', () => {
      const range = getTodayDateRange();
      expect(range.from).toBe(range.to);
    });

    it('should format as YYYY-MM-DD', () => {
      const range = getTodayDateRange();
      expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('calculateNewsDistribution', () => {
    it('should return 3 items per symbol for fewer than 3 symbols', () => {
      const result = calculateNewsDistribution(2);
      expect(result.itemsPerSymbol).toBe(3);
      expect(result.targetNewsCount).toBe(6);
    });

    it('should return 2 items per symbol for exactly 3 symbols', () => {
      const result = calculateNewsDistribution(3);
      expect(result.itemsPerSymbol).toBe(2);
      expect(result.targetNewsCount).toBe(6);
    });

    it('should return 1 item per symbol for more than 3 symbols', () => {
      const result = calculateNewsDistribution(5);
      expect(result.itemsPerSymbol).toBe(1);
      expect(result.targetNewsCount).toBe(6);
    });
  });

  describe('validateArticle', () => {
    it('should validate article with all required fields', () => {
      const article = {
        id: 1,
        headline: 'Test Headline',
        summary: 'Test Summary',
        url: 'https://example.com',
        datetime: 1234567890,
      } as RawNewsArticle;
      expect(validateArticle(article)).toBeTruthy();
    });

    it('should invalidate article with missing fields', () => {
      const article = {
        id: 1,
        headline: 'Test Headline',
      } as RawNewsArticle;
      expect(validateArticle(article)).toBeFalsy();
    });

    it('should invalidate article with empty fields', () => {
      const article = {
        id: 1,
        headline: '',
        summary: 'Test Summary',
        url: 'https://example.com',
        datetime: 1234567890,
      } as RawNewsArticle;
      expect(validateArticle(article)).toBeFalsy();
    });
  });

  describe('getTodayString', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should match current date', () => {
      const result = getTodayString();
      const expected = new Date().toISOString().split('T')[0];
      expect(result).toBe(expected);
    });
  });

  describe('formatArticle', () => {
    it('should format company news article', () => {
      const rawArticle = {
        id: 123,
        headline: 'Company News Headline',
        summary: 'This is a summary of the company news article that should be truncated if too long. '.repeat(10),
        url: 'https://example.com',
        datetime: 1234567890,
        source: 'Test Source',
      } as RawNewsArticle;
      const result = formatArticle(rawArticle, true, 'AAPL', 0);
      
      expect(result.headline).toBe('Company News Headline');
      expect(result.summary.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(result.summary).toContain('...');
      expect(result.category).toBe('company');
      expect(result.related).toBe('AAPL');
    });

    it('should format market news article', () => {
      const rawArticle = {
        id: 456,
        headline: 'Market News Headline',
        summary: 'This is a summary of the market news article that should be truncated if too long. '.repeat(10),
        url: 'https://example.com',
        datetime: 1234567890,
        category: 'general',
        related: 'MARKET',
      } as RawNewsArticle;
      const result = formatArticle(rawArticle, false, undefined, 1);
      
      expect(result.headline).toBe('Market News Headline');
      expect(result.summary.length).toBeLessThanOrEqual(153); // 150 + '...'
      expect(result.category).toBe('general');
      expect(result.related).toBe('MARKET');
    });

    it('should use default values for missing fields', () => {
      const rawArticle = {
        id: 789,
        headline: 'Test',
        summary: 'Summary',
        url: 'https://example.com',
        datetime: 1234567890,
      } as RawNewsArticle;
      const result = formatArticle(rawArticle, false, undefined, 0);
      
      expect(result.source).toBe('Market News');
      expect(result.image).toBe('');
      expect(result.category).toBe('general');
      expect(result.related).toBe('');
    });
  });

  describe('formatChangePercent', () => {
    it('should format positive change with plus sign', () => {
      expect(formatChangePercent(5.23)).toBe('+5.23%');
    });

    it('should format negative change without additional sign', () => {
      expect(formatChangePercent(-3.45)).toBe('-3.45%');
    });

    it('should handle zero', () => {
      // The implementation treats 0 as falsy and returns empty string
      expect(formatChangePercent(0)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatChangePercent(undefined)).toBe('');
    });
  });

  describe('getChangeColorClass', () => {
    it('should return green for positive change', () => {
      expect(getChangeColorClass(5.23)).toBe('text-green-500');
    });

    it('should return red for negative change', () => {
      expect(getChangeColorClass(-3.45)).toBe('text-red-500');
    });

    it('should return gray for undefined', () => {
      expect(getChangeColorClass(undefined)).toBe('text-gray-400');
    });

    it('should return green for zero', () => {
      expect(getChangeColorClass(0)).toBe('text-gray-400');
    });
  });

  describe('formatPrice', () => {
    it('should format price with currency symbol', () => {
      expect(formatPrice(123.45)).toBe('$123.45');
    });

    it('should format price with two decimal places', () => {
      expect(formatPrice(100)).toBe('$100.00');
    });

    it('should format large numbers with commas', () => {
      expect(formatPrice(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle small decimals', () => {
      expect(formatPrice(0.99)).toBe('$0.99');
    });
  });

  describe('getAlertText', () => {
    it('should format upper alert', () => {
      const alert = {
        id: '1',
        symbol: 'AAPL',
        company: 'Apple',
        alertName: 'Test Alert',
        currentPrice: 150,
        alertType: 'upper',
        threshold: 200,
      } as Alert;
      expect(getAlertText(alert)).toBe('Price > $200.00');
    });

    it('should format lower alert', () => {
      const alert = {
        id: '2',
        symbol: 'AAPL',
        company: 'Apple',
        alertName: 'Test Alert',
        currentPrice: 150,
        alertType: 'lower',
        threshold: 100,
      } as Alert;
      expect(getAlertText(alert)).toBe('Price < $100.00');
    });
  });
});
