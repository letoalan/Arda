// services/ia/ollama-client.ts

import { OllamaConfig, OllamaCompletionRequest, OllamaCompletionResponse, OllamaModelItem } from './ollamaTypes';

export type { OllamaConfig, OllamaCompletionRequest, OllamaCompletionResponse, OllamaModelItem };

export class OllamaClient {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    const attempts = this.config.retryAttempts ?? 2;

    for (let i = 0; i <= attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (i < attempts) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    const url = `${this.config.baseUrl}/api/generate`;
    const payload: OllamaCompletionRequest = {
      model: this.config.model,
      prompt,
      system: systemPrompt,
      stream: false,
      options: {
        temperature: this.config.temperature,
        top_k: this.config.topK,
        top_p: this.config.topP,
        num_predict: this.config.maxTokens,
        stop: this.config.stopSequences,
      },
    };

    return this.executeWithRetry(async () => {
      const response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        this.config.timeoutMs ?? 90000
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: OllamaCompletionResponse = await response.json();
      return data.response;
    });
  }

  async generateCompletionStream(
    prompt: string,
    onChunk: (text: string) => void,
    systemPrompt?: string
  ): Promise<string> {
    const url = `${this.config.baseUrl}/api/generate`;
    const payload: OllamaCompletionRequest = {
      model: this.config.model,
      prompt,
      system: systemPrompt,
      stream: true,
      options: {
        temperature: this.config.temperature,
        top_k: this.config.topK,
        top_p: this.config.topP,
        num_predict: this.config.maxTokens,
      },
    };

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      this.config.timeoutMs ?? 90000
    );

    if (!response.ok || !response.body) {
      throw new Error(`HTTP streaming error! Status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const parsed: OllamaCompletionResponse = JSON.parse(line);
          fullResponse += parsed.response;
          onChunk(parsed.response);
        } catch {
          // ignore partial JSON chunks
        }
      }
    }

    return fullResponse;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/tags`,
        { method: 'GET' },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/tags`,
        { method: 'GET' },
        5000
      );

      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((m: OllamaModelItem) => m.name);
    } catch {
      return [];
    }
  }
}
