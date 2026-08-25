// services/ia/ollamaTypes.ts

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
  timeoutMs?: number;
  retryAttempts?: number;
}

export interface OllamaCompletionRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaCompletionResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaModelItem {
  name: string;
  modified_at: string;
  size: number;
}
