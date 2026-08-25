import type { AiTask, AiProposalType, AiValidationResult } from '../core/schema/ai';

// Re‑export the validation result type for broader consumption.
export type { AiValidationResult };


export type ExtendedAiTask = AiTask | 'entity_extraction' | 'relation_generation' | 'naming_suggestion';

export interface IARequest {
  task: ExtendedAiTask;
  instruction: string;
  input?: string;
  context?: unknown;
}

export interface IAResponse {
  id: string;
  output: unknown;
  confidence: number;
  metadata: {
    model: string;
    timestamp: string;
    processingTimeMs?: number;
  };
}

export interface IAAdapterConfig {
  name: string;
  endpoint?: string;
  timeout?: number;
}

export interface IAAdapter<T extends IAAdapterConfig = IAAdapterConfig> {
  config: T;
  generate(request: IARequest): Promise<IAResponse>;
  validate(response: IAResponse): AiValidationResult;
}

export interface AISubEntity {
  id: string;
  name: string;
  type: string;
  geometry?: Record<string, unknown>;
  selected?: boolean;
  properties?: Record<string, unknown>;
}

export interface AIProposalPayload {
  id: string;
  type: AiProposalType;
  data: Record<string, unknown>;
  subEntities?: AISubEntity[];
}

export interface AIPendingProposal extends AIProposalPayload {
  sessionId: string;
  worldId: string;
  status: 'pending';
  confidence: number;
  createdAt: string;
}

export interface AIResolvedProposal extends AIProposalPayload {
  sessionId: string;
  worldId: string;
  status: 'accepted' | 'rejected';
  confidence: number;
  validation?: AiValidationResult;
  createdAt: string;
  resolvedAt: string;
}

export type AIProposal = AIPendingProposal | AIResolvedProposal;

export interface AISession {
  id: string;
  worldId: string;
  task: AiTask;
  instruction: string;
  context?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AIActionResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  data?: unknown;
}
