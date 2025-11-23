/**
 * SSE Event Emitter
 *
 * Provides a simple interface for emitting Server-Sent Events
 * during AI processing.
 */

export interface SSEEvent {
  type:
    | 'connected'
    | 'analyzing_intent'
    | 'routing_decision'
    | 'llm_classifying'
    | 'agent_processing'
    | 'calling_tool'
    | 'tool_result'
    | 'processing_results'
    | 'finalizing'
    | 'complete'
    | 'error'
    | 'heartbeat';
  message?: string;
  stage?: string;
  timestamp: string;
  // Routing-specific
  intent?: string;
  confidence?: number;
  method?: 'keyword' | 'llm' | 'hybrid';
  agent?: string;
  latency?: {
    keyword?: number;
    llm?: number;
    total: number;
  };
  // Tool-specific
  tool?: string;
  parameters?: Record<string, any>;
  resultCount?: number;
  // Completion
  data?: any;
  // Error
  error?: {
    message: string;
    code?: string;
  };
}

export type SSEEventEmitter = (_event: SSEEvent) => void;

/**
 * Create a no-op event emitter (for when SSE is not used)
 */
export function createNoOpEmitter(): SSEEventEmitter {
  return (_event: SSEEvent) => {
    // Do nothing - unused parameter prefixed with _ to satisfy linter
  };
}
