/**
 * Lyrics Processing Agent
 *
 * Specialized agent for processing song lyrics:
 * - Language detection
 * - Translation to English (if needed)
 * - Summarization for track descriptions
 *
 * @module LyricsProcessingAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { createModel } from './model-factory';
import { LYRICS_PROCESSING_SYSTEM_PROMPT } from './agent-prompts';
import type { AIProvider } from '@/types/ai-service';

export class LyricsProcessingAgent extends BaseAgent {
  private model: any;

  /**
   * Create a new LyricsProcessingAgent instance
   * @param provider - AI provider to use (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    super('LyricsProcessingAgent', LYRICS_PROCESSING_SYSTEM_PROMPT);
    // Azure OpenAI gpt-5-mini only supports temperature: 1 (handled by factory default)
    this.model = createModel(provider);
  }

  /**
   * Process lyrics: public entry point conforming to BaseAgent
   * @param message - Lyrics text to process
   * @param context - Optional agent context (may contain language)
   * @returns Agent response with processed lyrics (summary, translation, language)
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    // Extract language from context if provided (extended context for lyrics processing)
    const language = (context as any)?.language;
    const result = await this.processLyrics(message, language);
    return {
      message: result.summary,
      data: result,
    };
  }

  /**
   * Internal helper for direct lyrics processing
   * @param lyrics - Lyrics text to process
   * @param providedLanguage - Optional language hint (ISO code)
   * @returns Processed lyrics result with detected language, translation, and summary
   * @throws Error if lyrics are empty or processing fails
   */
  async processLyrics(
    lyrics: string,
    providedLanguage?: string
  ): Promise<{
    detectedLanguage: string;
    translatedLyrics?: string | null;
    summary: string;
  }> {
    if (!lyrics || lyrics.trim().length === 0) {
      throw new Error('Lyrics cannot be empty');
    }

    // Build prompt based on whether language is provided
    let prompt: string;
    if (providedLanguage && providedLanguage !== 'auto') {
      if (providedLanguage === 'en') {
        prompt = `These lyrics are in English. Generate a concise summary:\n\n${lyrics}`;
      } else {
        prompt = `These lyrics are in ${providedLanguage}. Translate them to English and generate a concise summary:\n\n${lyrics}`;
      }
    } else {
      prompt = `Detect the language of these lyrics, translate to English if needed, and generate a concise summary:\n\n${lyrics}`;
    }

    try {
      const response = await this.model.invoke([
        { role: 'system', content: LYRICS_PROCESSING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);

      const content = response.content as string;

      // Try to parse JSON response
      try {
        // Extract JSON from response (handle cases where AI adds extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            detectedLanguage:
              parsed.detectedLanguage || providedLanguage || 'en',
            translatedLyrics: parsed.translatedLyrics || null,
            summary: parsed.summary || content,
          };
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract summary from text
        console.warn(
          'Failed to parse JSON response, extracting summary from text:',
          parseError
        );
      }

      // Fallback: return the raw content as summary
      return {
        detectedLanguage: providedLanguage || 'en',
        translatedLyrics: null,
        summary: content.trim(),
      };
    } catch (error) {
      console.error('Error processing lyrics:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to process lyrics: ${error.message}`
          : 'Failed to process lyrics'
      );
    }
  }
}
