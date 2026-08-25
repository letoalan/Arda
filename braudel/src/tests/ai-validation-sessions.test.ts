// tests/ai-validation-sessions.test.ts

import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as db from '../services/persistence/indexeddb';

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

describe('AI Session management & workflow', () => {
  beforeAll(() => {
    aiService.setAdapter(new MockIAAdapter({ errorRate: 0, delay: 0 }));
  });

  it('should generate a valid proposal structure', async () => {
    const validSessionId = '123e4567-e89b-12d3-a456-426614174000';
    const proposal = await aiService.generateProposal({
      task: 'generateEntity',
      instruction: 'Text to analyze',
      input: 'Text to analyze',
      context: { sessionId: validSessionId, worldId: 'world-456' },
    });

    expect(proposal.id).toBeDefined();
    expect(proposal.sessionId).toBe(validSessionId);
    expect(proposal.worldId).toBe('world-456');
    expect(proposal.status).toBe('pending');
  });

  it('should reject already resolved proposal', async () => {
    const resolvedProposal = {
      id: 'test-proposal-id',
      status: 'accepted' as const
    };

    vi.mocked(db.get).mockResolvedValue(resolvedProposal as any);

    await expect(
      aiService.acceptProposal('test-proposal-id')
    ).rejects.toThrow(/already resolved/);
  });

  it('should create a valid session structure', async () => {
    vi.mocked(db.put).mockResolvedValue(undefined);

    const session = await aiService.createSession(
      'test-world-id',
      'generateEntity' as any,
      'Test instruction',
      {}
    );

    expect(session.id).toBeDefined();
    expect(session.worldId).toBe('test-world-id');
    expect(session.instruction).toBe('Test instruction');
  });
});
