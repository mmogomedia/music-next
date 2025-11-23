import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { createModel } from './model-factory';
import { TRACK_METADATA_SYSTEM_PROMPT } from './agent-prompts';
import type { AIProvider } from '@/types/ai-service';

export interface TrackMetadataResult {
  description: string;
  attributes: string[];
  mood: string[];
  detectedLanguage?: string;
}

interface TrackMetadataInput {
  lyrics: string;
  language?: string;
  description?: string | null;
  attributes?: string[];
  mood?: string[];
}

export class TrackMetadataAgent extends BaseAgent {
  private model: any;

  /**
   * Create a new TrackMetadataAgent instance
   * @param provider - AI provider to use (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    super('TrackMetadataAgent', TRACK_METADATA_SYSTEM_PROMPT);
    this.model = createModel(provider);
  }

  /**
   * Process lyrics and return metadata (description, attributes, mood)
   * @param message - Lyrics text to process
   * @param context - Optional agent context (may contain language)
   * @returns Agent response with derived metadata
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const result = await this.deriveMetadata({
      lyrics: message,
      language: (context as any)?.language,
    });

    return {
      message: result.description,
      data: result,
    };
  }

  /**
   * Derive track metadata (description, attributes, mood) from lyrics using AI
   * @param input - Track metadata input with lyrics and optional existing fields
   * @returns Derived metadata result
   * @throws Error if lyrics are empty or AI processing fails
   */
  async deriveMetadata(
    input: TrackMetadataInput
  ): Promise<TrackMetadataResult> {
    if (!input.lyrics || input.lyrics.trim().length === 0) {
      throw new Error('Lyrics cannot be empty');
    }

    const prompt = this.buildPrompt(input);

    try {
      const response = await this.model.invoke([
        { role: 'system', content: TRACK_METADATA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);

      const content =
        typeof response.content === 'string'
          ? response.content
          : Array.isArray(response.content)
            ? response.content
                .map((part: { text?: string }) => part?.text ?? '')
                .join('\n')
            : '';

      const parsed = this.safeParse(content);

      return {
        description: parsed.description || content.trim(),
        attributes: this.normalizeArray(parsed.attributes),
        mood: this.normalizeArray(parsed.mood),
        detectedLanguage: parsed.detectedLanguage || input.language || 'other',
      };
    } catch (error) {
      console.error('Error deriving track metadata:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to derive metadata: ${error.message}`
          : 'Failed to derive metadata'
      );
    }
  }

  /**
   * Build prompt for AI metadata derivation
   * @param input - Track metadata input
   * @returns Formatted prompt string
   */
  private buildPrompt({
    lyrics,
    language,
    description,
    attributes,
    mood,
  }: TrackMetadataInput): string {
    const sections = [
      `Lyrics:\n${lyrics}`.trim(),
      language && language !== 'auto'
        ? `Language: ${language}`
        : 'Language: unknown',
      description
        ? `Existing description: ${description}`
        : 'Existing description: none',
      attributes && attributes.length > 0
        ? `Existing attributes: ${attributes.join(', ')}`
        : 'Existing attributes: none',
      mood && mood.length > 0
        ? `Existing mood tags: ${mood.join(', ')}`
        : 'Existing mood tags: none',
      'Return concise JSON metadata that respects the rules.',
    ];

    return sections.join('\n\n');
  }

  /**
   * Safely parse JSON metadata from AI response
   * @param content - Raw AI response content
   * @returns Parsed metadata result with fallback values
   */
  private safeParse(content: string): TrackMetadataResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || '',
          attributes: this.normalizeArray(parsed.attributes),
          mood: this.normalizeArray(parsed.mood),
          detectedLanguage: parsed.detectedLanguage || 'other',
        };
      }
    } catch (error) {
      console.warn('Failed to parse metadata JSON response:', error);
    }

    return {
      description: content.trim(),
      attributes: [],
      mood: [],
      detectedLanguage: 'other',
    };
  }

  /**
   * Normalize array values to unique lowercase strings
   * @param values - Array of unknown values
   * @returns Normalized array of unique strings
   */
  private normalizeArray(values?: unknown): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    const set = new Set<string>();
    values.forEach(value => {
      if (typeof value === 'string') {
        const normalized = value.trim();
        if (normalized) {
          const key = normalized.toLowerCase();
          if (!set.has(key)) {
            set.add(key);
          }
        }
      }
    });

    return Array.from(set);
  }
}
