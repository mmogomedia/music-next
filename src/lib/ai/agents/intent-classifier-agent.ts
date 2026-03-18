/**
 * Intent Classifier Agent
 *
 * LLM-based agent for classifying user intent when keyword-based routing
 * has low confidence. Used as a fallback in hybrid routing approach.
 *
 * @module IntentClassifierAgent
 */

import { BaseAgent, type AgentContext } from './base-agent';
import { createModel } from './model-factory';
import { INTENT_CLASSIFICATION_PROMPT } from './agent-prompts';
import type { RoutingDecision, AgentIntent } from './router-agent';
import type { AIProvider } from '@/types/ai-service';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Intent classification result from LLM
 */
interface IntentClassificationResult {
  intent: AgentIntent;
  confidence: number;
  reasoning?: string;
  needsClarification?: boolean;
  isMetaQuestion?: boolean;
}

/**
 * Intent Classifier Agent
 *
 * Uses LLM to classify user intent when keyword-based routing is uncertain.
 */
export class IntentClassifierAgent extends BaseAgent {
  private model: ReturnType<typeof createModel>;

  /**
   * Create a new IntentClassifierAgent instance
   * @param provider - AI provider to use (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    super('IntentClassifierAgent', INTENT_CLASSIFICATION_PROMPT);
    this.model = createModel(provider, {
      temperature: 0.3, // Lower temperature for more consistent classification
    });
  }

  /**
   * Classify user intent from message and context
   * @param message - User message to classify
   * @param context - Optional context including conversation history
   * @returns Routing decision with intent, confidence, agent, and metadata
   */
  async classifyIntent(
    message: string,
    context?: AgentContext
  ): Promise<
    RoutingDecision & { needsClarification?: boolean; isMetaQuestion?: boolean }
  > {
    try {
      const prompt = this.buildClassificationPrompt(message, context);
      const response = await this.model.invoke(prompt, context?.runConfig);
      const result = this.parseIntentResponse(response.content as string);

      return {
        intent: result.intent,
        confidence: result.confidence,
        agent: this.getAgentForIntent(result.intent),
        needsClarification: result.needsClarification ?? false,
        isMetaQuestion: result.isMetaQuestion ?? false,
      };
    } catch (error) {
      console.error('IntentClassifierAgent error:', error);
      // Fallback to discovery intent on error
      return {
        intent: 'discovery',
        confidence: 0.5,
        agent: 'DiscoveryAgent',
        needsClarification: false,
        isMetaQuestion: false,
      };
    }
  }

  /**
   * Process a user message (implements BaseAgent interface)
   * Note: This agent is primarily used for classification, not direct processing
   */
  async process(
    _message: string,
    _context?: AgentContext
  ): Promise<import('./base-agent').AgentResponse> {
    // This agent doesn't process messages directly - it only classifies intent
    throw new Error(
      'IntentClassifierAgent.process() should not be called. Use classifyIntent() instead.'
    );
  }

  /**
   * Build classification prompt with message and context
   */
  private buildClassificationPrompt(
    message: string,
    context?: AgentContext
  ): (SystemMessage | HumanMessage)[] {
    let contextInfo = '';

    // Add conversation history if available
    if (
      context?.conversationHistory &&
      context.conversationHistory.length > 0
    ) {
      const recent = context.conversationHistory.slice(-3);
      contextInfo += '\n\nRecent conversation:\n';
      recent.forEach(msg => {
        const role = msg.role || 'user';
        const content =
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content);
        contextInfo += `${role}: ${content}\n`;
      });
    }

    // Add filters if available
    if (context?.filters) {
      if (context.filters.genre) {
        contextInfo += `\nUser's preferred genre: ${context.filters.genre}`;
      }
      if (context.filters.province) {
        contextInfo += `\nUser's location: ${context.filters.province}`;
      }
    }

    // Add previous intent if available
    if (context?.metadata?.previousIntent) {
      contextInfo += `\nPrevious intent: ${context.metadata.previousIntent}`;
    }

    const prompt = `${this.systemPrompt}${contextInfo}\n\nUser message: "${message}"\n\nClassify the intent and return JSON only: { "intent": "...", "confidence": 0.0-1.0, "reasoning": "...", "needsClarification": boolean, "isMetaQuestion": boolean }`;

    return [new SystemMessage(this.systemPrompt), new HumanMessage(prompt)];
  }

  /**
   * Parse LLM response into structured intent classification
   */
  private parseIntentResponse(response: string): IntentClassificationResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: this.normalizeIntent(parsed.intent),
          confidence: this.normalizeConfidence(parsed.confidence),
          reasoning: parsed.reasoning,
          needsClarification: parsed.needsClarification === true,
          isMetaQuestion: parsed.isMetaQuestion === true,
        };
      }

      // Fallback: try to extract intent from text
      const intentMatch = response.match(
        /intent["\s:]+(discovery|recommendation|industry|abuse)/i
      );
      if (intentMatch) {
        return {
          intent: this.normalizeIntent(intentMatch[1]),
          confidence: 0.7, // Default confidence for text-based extraction
        };
      }

      // Default fallback
      return {
        intent: 'discovery',
        confidence: 0.5,
      };
    } catch (error) {
      console.error('Failed to parse intent response:', error);
      return {
        intent: 'discovery',
        confidence: 0.5,
      };
    }
  }

  /**
   * Normalize intent string to valid AgentIntent
   */
  private normalizeIntent(intent: string): AgentIntent {
    const normalized = intent.toLowerCase().trim();
    const validIntents: AgentIntent[] = [
      'discovery',
      'recommendation',
      'industry',
      'abuse',
      'help',
    ];

    if (validIntents.includes(normalized as AgentIntent)) {
      return normalized as AgentIntent;
    }

    // Default to discovery
    return 'discovery';
  }

  /**
   * Normalize confidence value to 0.0-1.0 range
   */
  private normalizeConfidence(confidence: any): number {
    const num =
      typeof confidence === 'number' ? confidence : parseFloat(confidence);
    if (isNaN(num)) return 0.5;
    return Math.max(0.0, Math.min(1.0, num));
  }

  /**
   * Get agent name for intent type
   */
  private getAgentForIntent(intent: AgentIntent): RoutingDecision['agent'] {
    switch (intent) {
      case 'recommendation':
        return 'RecommendationAgent';
      case 'discovery':
        return 'DiscoveryAgent';
      case 'abuse':
        return 'AbuseGuardAgent';
      case 'industry':
        return 'IndustryInfoAgent';
      case 'help':
        return 'HelpAgent';
      default:
        return 'DiscoveryAgent';
    }
  }
}
