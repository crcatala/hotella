/**
 * Typed error classes for CLI operations.
 */

export class CliError extends Error {
  constructor(
    message: string,
    public code: string,
    public exitCode = 1,
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'CliError'
  }

  toJSON(): Record<string, unknown> {
    return {
      error: true,
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    }
  }
}

export class UsageError extends CliError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'USAGE_ERROR', 2, details)
    this.name = 'UsageError'
  }
}

export class ApiError extends CliError {
  constructor(
    message: string,
    public statusCode?: number,
    details?: Record<string, unknown>,
  ) {
    super(message, 'API_ERROR', 1, { statusCode, ...details })
    this.name = 'ApiError'
  }
}

export function isCliError(error: unknown): error is CliError {
  return error instanceof CliError
}
