// tests/ai-validation-output.test.ts

import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('../services/persistence/indexeddb', () => ({
  openDB: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  deleteRecord: vi.fn().mockResolvedValue(undefined),
  queryByWorldId: vi.fn().mockResolvedValue([]),
  getAll: vi.fn().mockResolvedValue([]),
}));

import { MockIAAdapter } from '../services/ia/mock';
import { aiService } from '../services/ia/ai-service';

describe('AI Output Validation', () => {
  beforeAll(() => {
    aiService.setAdapter(new MockIAAdapter({ errorRate: 0, delay: 0 }));
  });

  describe('Output validation rules', () => {
    it('should validate a valid AI response', () => {
      const adapter = new MockIAAdapter();
      const response = {
        id: '123',
        output: { name: 'Test Entity', type: 'place' },
        confidence: 0.85,
        metadata: { model: 'mock-v1', timestamp: new Date().toISOString() },
      };

      const result = adapter.validate(response);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid AI response', () => {
      const adapter = new MockIAAdapter();
      const response = {
        id: '123',
        output: null,
        confidence: 0.85,
        metadata: { model: '', timestamp: '' },
      };

      const result = adapter.validate(response);
      expect(result.isValid).toBe(false);
      expect((result.errors ?? []).length).toBeGreaterThan(0);
    });

    it('should warn on low confidence', () => {
      const adapter = new MockIAAdapter();
      const response = {
        id: '123',
        output: { name: 'Uncertain Entity' },
        confidence: 0.2,
        metadata: { model: 'mock-v1', timestamp: new Date().toISOString() },
      };

      const result = adapter.validate(response);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });
  });
});
