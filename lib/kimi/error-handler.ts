import { logger } from '../logger';

export interface UnifiedErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    provider: 'kimi';
    requestId: string;
    timestamp: string;
    details?: any;
  };
}

export class KimiAPIError extends Error {
  public statusCode: number;
  public errorCode: string;
  public requestId: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'KIMI_INTERNAL_ERROR', requestId?: string, details?: any) {
    super(message);
    this.name = 'KimiAPIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.requestId = requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.details = details;
  }
}

/**
 * Maps raw Kimi API / HTTP error codes to unified system error format and logs with full context.
 */
export function handleKimiError(
  error: unknown,
  context: { requestId?: string; userId?: string; endpoint?: string } = {}
): UnifiedErrorResponse {
  const requestId = context.requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  let statusCode = 500;
  let errorCode = 'KIMI_UNEXPECTED_ERROR';
  let userFriendlyMessage = 'An unexpected error occurred while communicating with the Kimi AI service.';
  let details: any = undefined;

  if (error instanceof KimiAPIError) {
    statusCode = error.statusCode;
    errorCode = error.errorCode;
    userFriendlyMessage = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('Unauthorized')) {
      statusCode = 401;
      errorCode = 'KIMI_AUTHENTICATION_FAILED';
      userFriendlyMessage = 'Authentication failed with Kimi service. Please check configured API credentials.';
    } else if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('Too Many Requests')) {
      statusCode = 429;
      errorCode = 'KIMI_RATE_LIMIT_EXCEEDED';
      userFriendlyMessage = 'Kimi API rate limit exceeded. Please try again shortly.';
    } else if (msg.includes('400') || msg.includes('context_length_exceeded')) {
      statusCode = 400;
      errorCode = 'KIMI_CONTEXT_LENGTH_EXCEEDED';
      userFriendlyMessage = 'Request context length exceeded maximum token limit.';
    } else if (msg.includes('503') || msg.includes('502') || msg.includes('service_unavailable')) {
      statusCode = 503;
      errorCode = 'KIMI_SERVICE_UNAVAILABLE';
      userFriendlyMessage = 'Kimi AI service is temporarily unavailable. Circuit breaker fallback active.';
    } else {
      userFriendlyMessage = msg;
    }
  }

  // Audit log with full context
  logger.error('[KimiAPI] Error occurred', {
    requestId,
    timestamp,
    userId: context.userId || 'anonymous',
    endpoint: context.endpoint || 'unknown',
    statusCode,
    errorCode,
    error: error instanceof Error ? error.message : String(error),
  });

  return {
    success: false,
    error: {
      code: errorCode,
      message: userFriendlyMessage,
      provider: 'kimi',
      requestId,
      timestamp,
      ...(details ? { details } : {})
    }
  };
}
