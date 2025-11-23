/**
 * Model Factory
 *
 * Standardized factory for creating LLM model instances based on provider.
 * Centralizes model initialization logic used across all agents.
 *
 * @module ModelFactory
 */

import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { AIProvider } from '@/types/ai-service';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * Default model configuration
 */
const DEFAULT_CONFIG = {
  azure: {
    deploymentName:
      process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
    temperature: 1,
  },
  openai: {
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  },
  anthropic: {
    modelName: 'claude-3-5-sonnet',
    temperature: 0.7,
  },
  google: {
    model: 'gemini-pro',
    temperature: 0.7,
  },
} as const;

/**
 * Models that only support default temperature (temperature = 1)
 * These models don't support custom temperature values
 */
const TEMPERATURE_LOCKED_MODELS = ['gpt-5-mini', 'gpt-4o-mini'];

/**
 * Check if a model supports custom temperature values
 */
function supportsCustomTemperature(
  deploymentName?: string,
  modelName?: string
): boolean {
  const name = deploymentName || modelName || '';
  return !TEMPERATURE_LOCKED_MODELS.some(locked =>
    name.toLowerCase().includes(locked.toLowerCase())
  );
}

/**
 * Create an LLM model instance based on the provider
 *
 * @param provider - The AI provider to use
 * @param overrides - Optional configuration overrides (e.g., custom temperature)
 * @returns Configured chat model instance
 */
export function createModel(
  provider: AIProvider = 'azure-openai',
  overrides?: {
    temperature?: number;
    modelName?: string;
    deploymentName?: string;
    apiVersion?: string;
  }
): BaseChatModel {
  switch (provider) {
    case 'azure-openai': {
      const deploymentName =
        overrides?.deploymentName || DEFAULT_CONFIG.azure.deploymentName;

      // Models like gpt-5-mini only support temperature = 1
      // Always use temperature 1 for locked models, ignore overrides
      const temperature = supportsCustomTemperature(deploymentName)
        ? (overrides?.temperature ?? DEFAULT_CONFIG.azure.temperature)
        : 1; // Locked models must use temperature = 1

      return new AzureChatOpenAI({
        azureOpenAIApiDeploymentName: deploymentName,
        azureOpenAIApiVersion:
          overrides?.apiVersion || DEFAULT_CONFIG.azure.apiVersion,
        temperature,
      });
    }

    case 'openai': {
      const modelName = overrides?.modelName || DEFAULT_CONFIG.openai.modelName;

      // Models like gpt-4o-mini only support temperature = 1
      // Always use temperature 1 for locked models, ignore overrides
      const temperature = supportsCustomTemperature(undefined, modelName)
        ? (overrides?.temperature ?? DEFAULT_CONFIG.openai.temperature)
        : 1; // Locked models must use temperature = 1

      return new ChatOpenAI({
        modelName: modelName,
        temperature,
      });
    }

    case 'anthropic':
      return new ChatAnthropic({
        modelName: overrides?.modelName || DEFAULT_CONFIG.anthropic.modelName,
        temperature:
          overrides?.temperature ?? DEFAULT_CONFIG.anthropic.temperature,
      });

    case 'google':
      return new ChatGoogleGenerativeAI({
        model: overrides?.modelName || DEFAULT_CONFIG.google.model,
        temperature:
          overrides?.temperature ?? DEFAULT_CONFIG.google.temperature,
      });

    default:
      // Default to Azure OpenAI
      return new AzureChatOpenAI({
        azureOpenAIApiDeploymentName: DEFAULT_CONFIG.azure.deploymentName,
        azureOpenAIApiVersion: DEFAULT_CONFIG.azure.apiVersion,
        temperature: DEFAULT_CONFIG.azure.temperature,
      });
  }
}
