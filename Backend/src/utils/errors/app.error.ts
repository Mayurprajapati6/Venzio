/**
 * @file app.error.ts
 */

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly name: string;

  protected constructor(
    message: string,
    statusCode: number,
    name: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = name;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/* =======================
   ERROR TYPES
======================= */

export class InternalServerError extends AppError {
  constructor(message: string) {
    super(message, 500, "InternalServerError");
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, "BadRequestError");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NotFoundError");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, "UnauthorizedError");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, "ForbiddenError");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "ConflictError");
  }
}

export class NotImplementedError extends AppError {
  constructor(message: string) {
    super(message, 501, "NotImplementedError");
  }
}
