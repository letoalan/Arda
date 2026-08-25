// services/ia/ai-service.ts

import type { IAAdapter, IARequest, AIProposal, AISession } from '../../types/ia';
import { aiSessionSchema, AiTask } from '../../core/schema/ai';
import * as db from '../persistence/indexeddb';
import { createMockIAAdapter } from './mock';
import { OllamaClient } from './ollama-client';
import { OllamaIAAdapter } from './ollama-adapter';
import { processAndStoreProposal } from './aiProposalGenerator';

export interface StreamProgress {
  chunk: string;
  fullContent: string;
  progress: number;
}

export class AIService {
  private adapter: IAAdapter;
  private ollamaClient?: OllamaClient;

  constructor(adapter?: IAAdapter) {
    this.adapter = adapter ?? createMockIAAdapter();
  }

  setAdapter(adapter: IAAdapter): void {
    this.adapter = adapter;
  }

  async connectToOllama(config: { baseUrl: string; model: string }): Promise<boolean> {
    try {
      this.ollamaClient = new OllamaClient({
        baseUrl: config.baseUrl,
        model: config.model,
      });
      
      const isConnected = await this.ollamaClient.testConnection();
      
      if (isConnected) {
        this.adapter = new OllamaIAAdapter({
          name: 'ollama',
          baseUrl: config.baseUrl,
          model: config.model,
        });
      }
      
      return isConnected;
    } catch (error) {
      console.error('Failed to connect to Ollama:', error);
      return false;
    }
  }

  async isOllamaConnected(): Promise<boolean> {
    if (!this.ollamaClient) return false;
    
    try {
      return await this.ollamaClient.testConnection();
    } catch {
      return false;
    }
  }

  disconnectFromOllama(): void {
    this.ollamaClient = undefined;
    this.adapter = createMockIAAdapter();
  }

  getAdapterName(): string {
    return (this.adapter as any).config?.name || 'unknown';
  }

  async createSession(worldId: string, task: AiTask, instruction: string, context?: Record<string, unknown>): Promise<AISession> {
    const session = {
      id: crypto.randomUUID(),
      worldId,
      task,
      instruction,
      context,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = aiSessionSchema.safeParse(session);
    if (!result.success) {
      throw new Error(`Invalid session data: ${result.error.message}`);
    }

    await db.put('ai', { ...session, type: 'session' });
    return session;
  }

  async generateProposal(request: IARequest): Promise<AIProposal> {
    return processAndStoreProposal(request, this.adapter);
  }

  async generateStream(
    request: IARequest,
    onProgress: (progress: StreamProgress) => void
  ): Promise<AIProposal> {
    if (this.ollamaClient && this.adapter instanceof OllamaIAAdapter) {
      let fullContent = '';
      const prompt = request.input ?? request.instruction;

      await this.ollamaClient.generateCompletionStream(
        prompt,
        (chunk) => {
          fullContent += chunk;
          onProgress({
            chunk,
            fullContent,
            progress: Math.min(99, Math.round((fullContent.length / 500) * 100)),
          });
        }
      );

      onProgress({ chunk: '', fullContent, progress: 100 });

      return this.generateProposal({
        ...request,
        input: fullContent || request.input || request.instruction,
      });
    }

    return this.generateProposal(request);
  }

  async acceptProposal(proposalId: string): Promise<void> {
    const existing = await db.get<any>('ai', proposalId);
    if (existing && existing.status && existing.status !== 'pending') {
      throw new Error(`Proposal ${proposalId} is already resolved`);
    }
    if (existing) {
      existing.status = 'accepted';
      existing.acceptedAt = new Date().toISOString();
      await db.put('ai', existing);
    }
  }

  async rejectProposal(proposalId: string): Promise<void> {
    const existing = await db.get<any>('ai', proposalId);
    if (existing && existing.status && existing.status !== 'pending') {
      throw new Error(`Proposal ${proposalId} is already resolved`);
    }
    if (existing) {
      existing.status = 'rejected';
      existing.rejectedAt = new Date().toISOString();
      await db.put('ai', existing);
    }
  }
}

export const aiService = new AIService();


