import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/error.js';
import { createErrorResponse } from '../types/response.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      createErrorResponse(err.code, err.message, err.details)
    );
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json(
    createErrorResponse('INTERNAL_ERROR', 'Internal server error')
  );
}
