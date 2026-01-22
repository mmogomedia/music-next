/**
 * Centralized Configuration
 *
 * Single source of truth for all environment variables and configuration.
 * Validates required environment variables at module load time.
 */

// ============================================================================
// CONFIGURATION OBJECT
// ============================================================================

export const config = {
  /**
   * Application environment
   */
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  /**
   * Database configuration
   */
  database: {
    url: process.env.DATABASE_URL!,
    logLevel: process.env.DATABASE_LOG_LEVEL || 'info',
  },

  /**
   * Authentication configuration
   */
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      enabled:
        !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  /**
   * TikTok OAuth configuration
   */
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri:
      process.env.TIKTOK_REDIRECT_URI ||
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pulse/tiktok/callback`,
    enabled:
      !!process.env.TIKTOK_CLIENT_KEY && !!process.env.TIKTOK_CLIENT_SECRET,
  },

  /**
   * Cloud storage (R2/S3) configuration
   */
  r2: {
    // Public URL for accessing files (client-side and server-side)
    publicUrl:
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      process.env.R2_PUBLIC_URL ||
      'https://asset.flemoji.com', // Fallback for development
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    // Check if R2 is fully configured
    enabled:
      !!process.env.R2_ENDPOINT &&
      !!process.env.R2_ACCESS_KEY_ID &&
      !!process.env.R2_SECRET_ACCESS_KEY &&
      !!process.env.R2_BUCKET_NAME,
  },

  /**
   * AWS S3 configuration (legacy/alternative to R2)
   */
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.AWS_S3_BUCKET,
    enabled:
      !!process.env.AWS_ACCESS_KEY_ID &&
      !!process.env.AWS_SECRET_ACCESS_KEY &&
      !!process.env.AWS_S3_BUCKET,
  },

  /**
   * Email service configuration (Resend)
   */
  email: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL || 'noreply@flemoji.com',
    enabled: !!process.env.RESEND_API_KEY,
  },

  /**
   * Real-time messaging (Ably)
   */
  ably: {
    apiKey: process.env.ABLY_API_KEY,
    enabled: !!process.env.ABLY_API_KEY,
  },

  /**
   * AI services configuration
   */
  ai: {
    // Anthropic (Claude)
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      enabled: !!process.env.ANTHROPIC_API_KEY,
    },
    // OpenAI
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      enabled: !!process.env.OPENAI_API_KEY,
    },
    // Azure OpenAI
    azureOpenai: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      instanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
      deploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      embeddingsDeploymentName:
        process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
      enabled:
        !!process.env.AZURE_OPENAI_API_KEY &&
        (!!process.env.AZURE_OPENAI_ENDPOINT ||
          !!process.env.AZURE_OPENAI_API_INSTANCE_NAME) &&
        !!process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    },
    // Google (Gemini)
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      enabled: !!process.env.GOOGLE_API_KEY,
    },
    // Cohere
    cohere: {
      apiKey: process.env.COHERE_API_KEY,
      enabled: !!process.env.COHERE_API_KEY,
    },
  },

  /**
   * Payment processing (Stripe)
   */
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    enabled:
      !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PUBLISHABLE_KEY,
  },

  /**
   * Cron job authentication
   */
  cron: {
    secret: process.env.CRON_SECRET,
    enabled: !!process.env.CRON_SECRET,
  },

  /**
   * Application settings
   */
  app: {
    domain:
      process.env.NEXT_PUBLIC_APP_DOMAIN ||
      process.env.NEXTAUTH_URL ||
      'https://flemoji.co.za',
    name: 'Flemoji',
    supportEmail: 'support@flemoji.com',
  },

  /**
   * Testing configuration
   */
  test: {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  },
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Required environment variables
 * These MUST be set for the application to function
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
function validateConfig(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `
╔═══════════════════════════════════════════════════════════════╗
║                  CONFIGURATION ERROR                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Missing required environment variables:                      ║
║                                                               ║
${missing.map(v => `║  - ${v.padEnd(57)} ║`).join('\n')}
║                                                               ║
║  Please set these variables in your .env file                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `.trim();

    throw new Error(errorMessage);
  }
}

/**
 * Warn about optional but recommended environment variables
 */
function warnMissingOptional(): void {
  const warnings: string[] = [];

  // R2 storage warnings
  if (!config.r2.enabled) {
    warnings.push('R2 storage is not configured (file uploads will not work)');
  }

  // Email warnings
  if (!config.email.enabled) {
    warnings.push(
      'Email service is not configured (email sending will not work)'
    );
  }

  // AI warnings
  const hasAnyAI =
    config.ai.anthropic.enabled ||
    config.ai.openai.enabled ||
    config.ai.azureOpenai.enabled ||
    config.ai.google.enabled ||
    config.ai.cohere.enabled;

  if (!hasAnyAI) {
    warnings.push('No AI service configured (AI features will not work)');
  }

  if (warnings.length > 0 && config.env.isDevelopment) {
    console.warn('\n⚠️  Configuration Warnings:\n');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Validate configuration on module load
try {
  validateConfig();
  warnMissingOptional();
} catch (error) {
  if (config.env.isProduction) {
    // In production, fail fast
    throw error;
  } else {
    // In development/test, just warn
    console.error(error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a feature is enabled
 *
 * @param feature - Feature name to check
 * @returns True if feature is enabled
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('r2')) {
 *   // R2 storage is configured
 * }
 * ```
 */
export function isFeatureEnabled(
  feature: 'r2' | 'aws' | 'email' | 'ably' | 'stripe' | 'cron' | 'google-oauth'
): boolean {
  switch (feature) {
    case 'r2':
      return config.r2.enabled;
    case 'aws':
      return config.aws.enabled;
    case 'email':
      return config.email.enabled;
    case 'ably':
      return config.ably.enabled;
    case 'stripe':
      return config.stripe.enabled;
    case 'cron':
      return config.cron.enabled;
    case 'google-oauth':
      return config.auth.google.enabled;
    default:
      return false;
  }
}

/**
 * Get active AI providers
 *
 * @returns Array of enabled AI provider names
 *
 * @example
 * ```typescript
 * const providers = getActiveAIProviders();
 * // ['anthropic', 'openai']
 * ```
 */
export function getActiveAIProviders(): string[] {
  const providers: string[] = [];

  if (config.ai.anthropic.enabled) providers.push('anthropic');
  if (config.ai.openai.enabled) providers.push('openai');
  if (config.ai.azureOpenai.enabled) providers.push('azure-openai');
  if (config.ai.google.enabled) providers.push('google');
  if (config.ai.cohere.enabled) providers.push('cohere');

  return providers;
}

/**
 * Get the public URL base for file storage
 *
 * Works on both client and server side
 *
 * @returns Public URL base
 *
 * @example
 * ```typescript
 * const baseUrl = getPublicUrlBase();
 * // 'https://asset.flemoji.com'
 * ```
 */
export function getPublicUrlBase(): string {
  return config.r2.publicUrl;
}

/**
 * Check if running in development mode
 *
 * @returns True if in development
 */
export function isDevelopment(): boolean {
  return config.env.isDevelopment;
}

/**
 * Check if running in production mode
 *
 * @returns True if in production
 */
export function isProduction(): boolean {
  return config.env.isProduction;
}

/**
 * Check if running in test mode
 *
 * @returns True if in test
 */
export function isTest(): boolean {
  return config.env.isTest;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Config = typeof config;
export type AIProvider =
  | 'anthropic'
  | 'openai'
  | 'azure-openai'
  | 'google'
  | 'cohere';
export type Feature =
  | 'r2'
  | 'aws'
  | 'email'
  | 'ably'
  | 'stripe'
  | 'cron'
  | 'google-oauth';
