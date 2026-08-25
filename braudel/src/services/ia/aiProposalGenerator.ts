// services/ia/aiProposalGenerator.ts

import type { IAAdapter, IARequest, AIProposal } from '../../types/ia';
import { aiProposalSchema } from '../../core/schema/ai';
import * as db from '../persistence/indexeddb';

export function determineProposalType(task: string, output: any): 'addEntity' | 'addRelation' | 'updateEntity' | 'removeEntity' {
  if (task === 'relation_generation' || (output && output.sourceId && output.targetId)) {
    return 'addRelation';
  }
  return 'addEntity';
}

export async function processAndStoreProposal(
  request: IARequest,
  adapter: IAAdapter
): Promise<AIProposal> {
  const response = await adapter.generate(request);
  const validation = adapter.validate(response);
  
  if (!validation.isValid) {
    throw new Error(`Invalid AI response: ${JSON.stringify(validation.errors)}`);
  }

  const rawSessionId = (typeof request.context === 'object' && request.context !== null)
    ? ((request.context as any).sessionId || '')
    : (request.context as string || '');
    
  const sessionId = rawSessionId.trim() !== '' ? rawSessionId : crypto.randomUUID();

  const worldId = (typeof request.context === 'object' && request.context !== null)
    ? ((request.context as any).worldId || '')
    : '';

  const proposalType = determineProposalType(request.task, response.output);

  const proposal: AIProposal = {
    id: crypto.randomUUID(),
    sessionId,
    worldId,
    type: proposalType,
    status: 'pending',
    confidence: response.confidence,
    data: (response.output && typeof response.output === 'object' ? response.output : { raw: response.output }) as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  };

  const parseResult = aiProposalSchema.safeParse(proposal);
  if (!parseResult.success) {
    throw new Error(`Invalid proposal structure: ${parseResult.error.message}`);
  }

  await db.put('ai', { ...proposal, recordKind: 'proposal' });
  return proposal;
}
