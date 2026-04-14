import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '../../types/error.js';

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400, { foo: 'bar' });

    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('AppError');
  });

  it('should serialize to JSON correctly', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400, { foo: 'bar' });
    const json = error.toJSON();

    expect(json).toEqual({
      code: 'TEST_ERROR',
      message: 'Test message',
      statusCode: 400,
      details: { foo: 'bar' },
    });
  });
});

describe('ValidationError', () => {
  it('should create validation error with default code and status', () => {
    const error = new ValidationError('Invalid input');

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
  });

  it('should include details when provided', () => {
    const error = new ValidationError('Invalid input', { field: 'name' });

    expect(error.details).toEqual({ field: 'name' });
  });
});

describe('NotFoundError', () => {
  it('should create not found error with resource only', () => {
    const error = new NotFoundError('Project');

    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Project not found');
    expect(error.statusCode).toBe(404);
  });

  it('should create not found error with resource and id', () => {
    const error = new NotFoundError('Project', 'proj_123');

    expect(error.message).toBe('Project with id "proj_123" not found');
    expect(error.details).toEqual({ resource: 'Project', id: 'proj_123' });
  });
});

describe('ConflictError', () => {
  it('should create conflict error with default code and status', () => {
    const error = new ConflictError('Resource already exists');

    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('Resource already exists');
    expect(error.statusCode).toBe(409);
  });
});

describe('InternalError', () => {
  it('should create internal error with default message', () => {
    const error = new InternalError();

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toBe('Internal server error');
    expect(error.statusCode).toBe(500);
  });

  it('should accept custom message', () => {
    const error = new InternalError('Custom error message');

    expect(error.message).toBe('Custom error message');
  });
});
