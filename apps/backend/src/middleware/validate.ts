import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

import { ValidationError } from '../types/error.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      throw new ValidationError('Validation failed', { errors });
    }

    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      throw new ValidationError('Validation failed', { errors });
    }

    req.params = result.data as Record<string, string>;
    next();
  };
}

/** Validates req.query. Parsed values (e.g. coerced numbers) are stored on res.locals.query. */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      throw new ValidationError('Validation failed', { errors });
    }

    res.locals.query = result.data;
    next();
  };
}
