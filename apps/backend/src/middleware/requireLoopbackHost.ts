import type { RequestHandler } from 'express';

import { createErrorResponse } from '../types/response.js';

export function requireLoopbackHost(port: number): RequestHandler {
  const allowed = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
  return (req, res, next) => {
    const host = (req.get('host') ?? '').toLowerCase();
    if (!allowed.has(host)) {
      res.status(403).json(createErrorResponse('FORBIDDEN_HOST', 'Host is not allowed'));
      return;
    }
    next();
  };
}
