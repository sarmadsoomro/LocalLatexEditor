import { timingSafeEqual } from 'node:crypto';

import type { RequestHandler } from 'express';

import { createErrorResponse } from '../types/response.js';

export function requireApiToken(token: string): RequestHandler {
  const expected = Buffer.from(token);
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const presented = req.get('x-texcraft-token') ?? '';
    const actual = Buffer.from(presented);
    if (
      presented.length === 0 ||
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Missing or invalid API token'));
      return;
    }

    next();
  };
}
