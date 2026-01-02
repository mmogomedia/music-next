/**
 * Agent Event Service
 *
 * Centralized service for emitting agent events during AI processing.
 * Provides type-safe methods for different event types.
 *
 * @module AgentEventService
 */

import type { SSEEvent, SSEEventEmitter } from '@/lib/ai/sse-event-emitter';
import type { AgentIntent } from '../agents/router-agent';

export interface RoutingDecisionEvent {
  intent: AgentIntent | 'unknown';
  confidence: number;
  method: 'keyword' | 'llm' | 'hybrid' | 'clarification' | 'fallback';
  agent: string;
  latency: {
    keyword?: number;
    llm?: number;
    total: number;
  };
}

export interface AgentProcessingEvent {
  agent: string;
  message?: string;
}

/**
 * Service for emitting agent events
 */
export class AgentEventService {
  private emitEvent?: SSEEventEmitter;

  constructor(emitEvent?: SSEEventEmitter) {
    this.emitEvent = emitEvent;
  }

  /**
   * Emit a generic event
   */
  emit(event: SSEEvent): void {
    this.emitEvent?.(event);
  }

  /**
   * Emit an "analyzing intent" event
   */
  analyzingIntent(): void {
    this.emit({
      type: 'analyzing_intent',
      message: "Hmm, let me figure out what you're after... 🤔",
      stage: 'intent_analysis',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit an "LLM classifying" event
   */
  llmClassifying(): void {
    this.emit({
      type: 'llm_classifying',
      message: 'Just a sec, thinking... 💭',
      stage: 'llm_classification',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit a "routing decision" event
   */
  routingDecision(event: RoutingDecisionEvent): void {
    this.emit({
      type: 'routing_decision',
      intent: event.intent,
      confidence: event.confidence,
      method: event.method,
      agent: event.agent,
      latency: event.latency,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit an "agent processing" event
   */
  agentProcessing(event: AgentProcessingEvent): void {
    const agentMessages: Record<string, string> = {
      DiscoveryAgent: 'Rummaging through our music vault... 🎶',
      RecommendationAgent: 'Curating something special just for you... ✨',
      AbuseGuardAgent: 'Double-checking everything... 👀',
      IndustryInfoAgent: 'Digging up the info you need... 📚',
      HelpAgent: 'Getting the help guide ready... 🆘',
      FallbackAgent: 'Working my magic... ✨',
    };

    this.emit({
      type: 'agent_processing',
      agent: event.agent,
      message:
        event.message ||
        agentMessages[event.agent] ||
        'Processing your request...',
      stage: 'agent_execution',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit a "calling tool" event
   */
  callingTool(tool: string, parameters?: Record<string, any>): void {
    this.emit({
      type: 'calling_tool',
      tool,
      parameters,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit a "tool result" event
   */
  toolResult(tool: string, resultCount?: number): void {
    this.emit({
      type: 'tool_result',
      tool,
      resultCount,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit a "processing results" event
   */
  processingResults(message?: string): void {
    this.emit({
      type: 'processing_results',
      message: message || 'Almost there! Putting it all together... 🎨',
      stage: 'result_processing',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit a "finalizing" event
   */
  finalizing(message?: string): void {
    this.emit({
      type: 'finalizing',
      message: message || 'Finalizing your response... ✨',
      stage: 'finalization',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit a "complete" event
   */
  complete(data?: any): void {
    this.emit({
      type: 'complete',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit an "error" event
   */
  error(error: { message: string; code?: string }): void {
    this.emit({
      type: 'error',
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
