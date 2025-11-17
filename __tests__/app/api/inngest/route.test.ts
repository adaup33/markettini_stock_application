/**
 * @jest-environment node
 */

import * as inngestRoute from '@/app/api/inngest/route';

describe('Inngest API Route', () => {
  it('should export runtime as nodejs', () => {
    expect(inngestRoute.runtime).toBe('nodejs');
  });

  it('should export GET, POST, PUT handlers', () => {
    expect(inngestRoute.GET).toBeDefined();
    expect(inngestRoute.POST).toBeDefined();
    expect(inngestRoute.PUT).toBeDefined();
  });

  it('should have the correct runtime for Node.js dependencies', () => {
    // This test verifies that the route is configured to run on Node.js runtime
    // which is required for:
    // - nodemailer (email sending)
    // - MongoDB/Mongoose connections
    // - Gemini AI API calls
    expect(inngestRoute.runtime).toBe('nodejs');
  });
});
