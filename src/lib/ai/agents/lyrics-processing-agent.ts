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

import { BaseAgent } from './base-agent';
import { AzureChatOpenAI } from '@langchain/openai';
import type { AIProvider } from '@/types/ai-service';

const LYRICS_PROCESSING_SYSTEM_PROMPT = `You are a lyrics processing assistant for Flemoji, a South African music streaming platform.

Your role is to:
1. Detect the language of song lyrics (supporting South African languages, French, Portuguese, Shona, Ndebele, and others)
2. Translate lyrics to English if they are not already in English
3. Generate a concise, engaging summary of the lyrics for use as a track description

Guidelines:
- Language detection should be accurate (support: English, Zulu, Xhosa, Afrikaans, Northern Sotho, Tswana, Venda, Tsonga, Swati, Southern Ndebele, French, Portuguese, Shona, Ndebele, and others)
- Translations should preserve the meaning, emotion, and cultural context of the original lyrics
- Summaries should be 2-3 sentences, capturing the main theme, mood, and message
- Summaries should be engaging and suitable for a music streaming platform
- If lyrics are already in English, skip translation and only provide summary
- Maintain the artistic intent and emotional tone in both translation and summary

IMPORTANT: You MUST respond with valid JSON only. Use this exact format:
{
  "detectedLanguage": "en|zu|xh|af|nso|tn|ve|ts|ss|nr|fr|pt|sn|nd|other",
  "translatedLyrics": "translated text if translation was needed, otherwise null",
  "summary": "concise 2-3 sentence summary of the lyrics"
}`;

export class LyricsProcessingAgent extends BaseAgent {
  private model: any;

  constructor(provider: AIProvider = 'azure-openai') {
    super('LyricsProcessingAgent', LYRICS_PROCESSING_SYSTEM_PROMPT);

    // Initialize model based on provider
    switch (provider) {
      case 'azure-openai':
        this.model = new AzureChatOpenAI({
          azureOpenAIApiDeploymentName:
            process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
          azureOpenAIApiVersion:
            process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
          temperature: 1, // Azure OpenAI gpt-5-mini only supports temperature: 1
        });
        break;
      case 'openai':
        this.model = new (require('@langchain/openai').ChatOpenAI)({
          modelName: 'gpt-4o-mini',
          temperature: 0.7,
        });
        break;
      case 'anthropic':
        this.model = new (require('@langchain/anthropic').ChatAnthropic)({
          modelName: 'claude-3-5-sonnet',
          temperature: 0.7,
        });
        break;
      default:
        this.model = new AzureChatOpenAI({
          azureOpenAIApiDeploymentName:
            process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
          azureOpenAIApiVersion:
            process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
          temperature: 1, // Azure OpenAI gpt-5-mini only supports temperature: 1
        });
    }
  }

  /**
   * Process lyrics: detect language, translate if needed, and generate summary
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
