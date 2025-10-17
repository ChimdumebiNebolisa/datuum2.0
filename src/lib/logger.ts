/**
 * Logger utility for consistent logging across the application
 * Automatically filters logs in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const createLogger = (): Logger => ({
  debug: (..._args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ..._args);
    }
  },
  info: (..._args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ..._args);
    }
  },
  warn: (..._args: any[]) => {
    console.warn('[WARN]', ..._args);
  },
  error: (..._args: any[]) => {
    console.error('[ERROR]', ..._args);
  },
});

export const logger = createLogger();

// Export for testing
export { createLogger, type LogLevel, type Logger };