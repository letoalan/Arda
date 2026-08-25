// Ollama AI Adapter - Implements IAAdapter for Ollama API

import { IAAdapter, IARequest, IAResponse, AiValidationResult } from '../../types/ia';
import { OllamaClient, OllamaConfig } from './ollama-client';
import { ontologyService } from '../ontology/ontology-service';
import { BRAUDEL_SYSTEM_PROMPT, buildOllamaPrompt, parseOllamaResponse } from './ollamaPrompts';

export interface OllamaAdapterConfig extends OllamaConfig {
  name: string;
}

export class OllamaIAAdapter implements IAAdapter<OllamaAdapterConfig> {
  public config: OllamaAdapterConfig;
  private client: OllamaClient;

  constructor(config: Partial<OllamaAdapterConfig> = {}) {
    this.config = {
      name: 'ollama',
      baseUrl: config.baseUrl || 'http://localhost:11434',
      model: config.model || 'llama2',
      temperature: config.temperature ?? 0.7,
      topK: config.topK ?? 40,
      topP: config.topP ?? 0.9,
      maxTokens: config.maxTokens ?? 2048,
      stopSequences: config.stopSequences || [],
      timeoutMs: config.timeoutMs ?? 90000,
      retryAttempts: config.retryAttempts ?? 2,
      ...config,
    };

    this.client = new OllamaClient(this.config);
    this.loadOntologyTypes();
  }

  private async loadOntologyTypes() {
    try {
      await ontologyService.loadAll();
    } catch (error) {
      console.warn('Failed to load ontology types:', error);
    }
  }

  async generate(request: IARequest): Promise<IAResponse> {
    const startTime = Date.now();

    try {
      const prompt = buildOllamaPrompt(request);
      const rawResponse = await this.client.generateCompletion(
        prompt,
        BRAUDEL_SYSTEM_PROMPT
      );

      const output = parseOllamaResponse(rawResponse, request.task);

      return {
        id: crypto.randomUUID(),
        output,
        confidence: this.estimateConfidence(rawResponse),
        metadata: {
          model: this.config.model,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error('Ollama generation failed:', error);
      throw error;
    }
  }

  validate(response: IAResponse): AiValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!response.output) {
      errors.push('Response output is missing');
    }

    if (!response.metadata || !response.metadata.model) {
      errors.push('Response metadata is incomplete');
    }

    if (response.confidence < 0.3) {
      warnings.push('Low confidence score - consider reviewing the response');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private estimateConfidence(responseStr: string): number {
    if (responseStr.includes('"confidence"')) {
      const match = responseStr.match(/"confidence":\s*(0\.\d+|1\.0|1)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    let score = 0.8;
    if (responseStr.includes('unsure') || responseStr.includes('possibly')) score -= 0.2;
    if (responseStr.length < 50) score -= 0.1;
    return Math.max(0.1, Math.min(1.0, score));
  }

  async setModel(model: string): Promise<void> {
    this.config.model = model;
    this.client = new OllamaClient(this.config);
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  async listModels(): Promise<string[]> {
    return this.client.listModels();
  }
}
