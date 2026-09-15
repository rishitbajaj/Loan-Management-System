export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly errors?: FieldError[];

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message: string, errors?: FieldError[]): AppError {
    return new AppError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, message);
  }

  static validation(message: string, errors?: FieldError[]): AppError {
    return new AppError(422, message, errors);
  }
}
