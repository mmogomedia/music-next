/**
 * Logger utility for consistent console logging across the application
 * This allows us to control logging behavior in one place and enable/disable
 * logs based on environment or configuration
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  enableDebug: boolean;
}

const logLevels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  log: 3,
  debug: 4,
};

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      minLevel: 'log',
      enableDebug: process.env.NODE_ENV === 'development',
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return logLevels[level] <= logLevels[this.config.minLevel];
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    // Always log errors, regardless of environment
    // eslint-disable-next-line no-console
    console.error(...args);
  }

  debug(...args: unknown[]): void {
    if (this.config.enableDebug && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.log('🔍 [DEBUG]', ...args);
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LoggerConfig };
