/**
 * Application error types and handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} dengan ID ${id} tidak dijumpai`, 'NOT_FOUND', { entity, id });
    this.name = 'NotFoundError';
  }
}

export class DuplicateError extends AppError {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} dengan ${field} "${value}" sudah wujud`, 'DUPLICATE', { entity, field, value });
    this.name = 'DuplicateError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Nama pengguna atau kata laluan tidak sah') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Anda tidak mempunyai kebenaran untuk tindakan ini') {
    super(message, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'BUSINESS_RULE', details);
    this.name = 'BusinessRuleError';
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return 'Data yang dimasukkan tidak sah. Sila semak dan cuba lagi.';
    }
    return error.message;
  }

  return 'Ralat tidak dijangka berlaku. Sila cuba lagi.';
}

/**
 * Handle error and return standardized response
 */
export function handleError(error: unknown): { success: false; error: string; code?: string } {
  const message = getErrorMessage(error);
  const code = error instanceof AppError ? error.code : 'UNKNOWN_ERROR';

  console.error('[AppError]', { code, message, error });

  return {
    success: false,
    error: message,
    code,
  };
}
