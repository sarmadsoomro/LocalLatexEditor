import { describe, it, expect } from 'vitest';
import {
  createSuccessResponse,
  createErrorResponse,
  type ApiResponse,
} from '../../types/response.js';

describe('createSuccessResponse', () => {
  it('should create success response with data', () => {
    const data = { id: 'proj_123', name: 'Test Project' };
    const response = createSuccessResponse(data);

    expect(response).toEqual({
      success: true,
      data,
      error: null,
    });
  });

  it('should handle null data', () => {
    const response = createSuccessResponse(null);

    expect(response).toEqual({
      success: true,
      data: null,
      error: null,
    });
  });

  it('should handle array data', () => {
    const data = [{ id: '1' }, { id: '2' }];
    const response = createSuccessResponse(data);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
  });
});

describe('createErrorResponse', () => {
  it('should create error response with code and message', () => {
    const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input');

    expect(response).toEqual({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
      },
    });
  });

  it('should include details when provided', () => {
    const details = { field: 'name', constraint: 'required' };
    const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input', details);

    expect(response.error?.details).toEqual(details);
  });
});

describe('ApiResponse type', () => {
  it('should accept success response', () => {
    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: 'proj_123' },
      error: null,
    };

    expect(response.success).toBe(true);
  });

  it('should accept error response', () => {
    const response: ApiResponse = {
      success: false,
      data: null,
      error: {
        code: 'ERROR',
        message: 'Something went wrong',
      },
    };

    expect(response.success).toBe(false);
  });
});
