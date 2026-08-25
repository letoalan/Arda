import { z } from 'zod';

export const historySchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().optional(),
  action: z.string().min(1),
  timestamp: z.string().datetime(),
});

export type HistoryEntry = z.infer<typeof historySchema>;

export const createHistoryEntry = (action: string, worldId?: string): HistoryEntry => ({
  id: crypto.randomUUID(),
  worldId,
  action,
  timestamp: new Date().toISOString(),
});
