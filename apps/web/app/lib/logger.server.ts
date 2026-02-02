/**
 * System-wide logging utility for Deur Den Bocht application
 * 
 * This logger writes all logs to the Supabase database for centralized monitoring
 * and debugging. Logs are stored in the system_logs table.
 * 
 * Usage:
 * ```typescript
 * import { logger } from '~/lib/logger.server';
 * 
 * // Simple logging
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Payment failed', { error: err.message });
 * 
 * // With request context
 * logger.withRequest(request).info('API called', { endpoint: '/api/data' });
 * ```
 */

import { supabaseAdmin } from './supabase.server';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogContext {
  userId?: string;
  participantId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
}

export interface LogMetadata {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  category: string;
  message: string;
  metadata?: LogMetadata;
  context?: LogContext;
  error?: Error;
  statusCode?: number;
  durationMs?: number;
}

class Logger {
  private context: LogContext = {};

  /**
   * Create a new logger instance with request context
   */
  withRequest(request: Request): Logger {
    const logger = new Logger();
    
    const url = new URL(request.url);
    logger.context = {
      url: url.pathname + url.search,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                 request.headers.get('x-real-ip') || undefined,
      requestId: request.headers.get('x-request-id') || undefined,
    };
    
    return logger;
  }

  /**
   * Add user context to the logger
   */
  withUser(userId: string, participantId?: string): Logger {
    const logger = new Logger();
    logger.context = {
      ...this.context,
      userId,
      participantId: participantId || userId, // Assume participantId = userId if not provided
    };
    return logger;
  }

  /**
   * Add custom context to the logger
   */
  withContext(context: Partial<LogContext>): Logger {
    const logger = new Logger();
    logger.context = {
      ...this.context,
      ...context,
    };
    return logger;
  }

  /**
   * Log a debug message
   */
  async debug(category: string, message: string, metadata?: LogMetadata) {
    return this.log({ level: 'debug', category, message, metadata });
  }

  /**
   * Log an info message
   */
  async info(category: string, message: string, metadata?: LogMetadata) {
    return this.log({ level: 'info', category, message, metadata });
  }

  /**
   * Log a warning message
   */
  async warn(category: string, message: string, metadata?: LogMetadata) {
    return this.log({ level: 'warn', category, message, metadata });
  }

  /**
   * Log an error message
   */
  async error(category: string, message: string, error?: Error, metadata?: LogMetadata) {
    return this.log({ 
      level: 'error', 
      category, 
      message, 
      metadata,
      error,
    });
  }

  /**
   * Log a critical error message
   */
  async critical(category: string, message: string, error?: Error, metadata?: LogMetadata) {
    return this.log({ 
      level: 'critical', 
      category, 
      message, 
      metadata,
      error,
    });
  }

  /**
   * Core logging function that writes to the database
   */
  async log(entry: LogEntry): Promise<void> {
    try {
      const logData = {
        level: entry.level,
        category: entry.category,
        message: entry.message,
        user_id: this.context.userId || null,
        participant_id: this.context.participantId || null,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : null,
        request_id: this.context.requestId || null,
        ip_address: this.context.ipAddress || null,
        user_agent: this.context.userAgent || null,
        url: this.context.url || null,
        method: this.context.method || null,
        status_code: entry.statusCode || null,
        error_stack: entry.error?.stack || null,
        duration_ms: entry.durationMs || null,
      };

      // Write to database using service role (bypasses RLS)
      const { error } = await supabaseAdmin
        .from('system_logs')
        .insert(logData);

      if (error) {
        // Fallback to console if database write fails
        console.error('[Logger] Failed to write log to database:', error);
        console.log('[Logger] Original log:', entry);
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const consoleMethod = entry.level === 'error' || entry.level === 'critical' ? 'error' : 'log';
        console[consoleMethod](`[${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`, {
          metadata: entry.metadata,
          context: this.context,
          error: entry.error,
        });
      }
    } catch (err) {
      // Catch-all fallback to console
      console.error('[Logger] Exception in logger:', err);
      console.log('[Logger] Original log entry:', entry);
    }
  }

  /**
   * Helper to measure and log operation duration
   */
  async withTiming<T>(
    category: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      await this.info(category, `${operation} completed`, { durationMs: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      await this.error(category, `${operation} failed`, error as Error, { durationMs: duration });
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Helper to log API responses
 */
export async function logApiResponse(
  request: Request,
  response: Response,
  durationMs: number,
  metadata?: LogMetadata
) {
  const level: LogLevel = response.status >= 500 ? 'error' : 
                          response.status >= 400 ? 'warn' : 'info';
  
  await logger
    .withRequest(request)
    .log({
      level,
      category: 'api',
      message: `${request.method} ${new URL(request.url).pathname}`,
      metadata: {
        ...metadata,
        statusCode: response.status,
      },
      statusCode: response.status,
      durationMs,
    });
}

/**
 * Helper to create a request-scoped logger
 */
export function createRequestLogger(request: Request, userId?: string, participantId?: string) {
  let requestLogger = logger.withRequest(request);
  
  if (userId) {
    requestLogger = requestLogger.withUser(userId, participantId);
  }
  
  return requestLogger;
}
