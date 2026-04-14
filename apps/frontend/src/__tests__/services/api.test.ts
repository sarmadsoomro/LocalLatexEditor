import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('apiClient', () => {
  it('should make GET request and return data', async () => {
    const { apiClient } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1', name: 'Test' }, error: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const result = await apiClient<{ id: string; name: string }>('/api/projects');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('should make POST request with body', async () => {
    const { apiClient } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1' }, error: null };
    const requestBody = { name: 'New Project' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await apiClient('/api/projects', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('should throw ApiError on unsuccessful response with error data', async () => {
    const { apiClient, ApiError } = await import('../../services/api');
    const errorData = {
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'name' },
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve(errorData),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve(errorData),
    });

    await expect(apiClient('/api/projects')).rejects.toThrow(ApiError);
    await expect(apiClient('/api/projects')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      statusCode: 400,
    });
  });

  it('should throw ApiError on HTTP error without JSON body', async () => {
    const { apiClient, ApiError } = await import('../../services/api');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Invalid JSON')),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(apiClient('/api/projects')).rejects.toThrow(ApiError);
    await expect(apiClient('/api/projects')).rejects.toMatchObject({
      code: 'HTTP_500',
      message: 'Internal Server Error',
      statusCode: 500,
    });
  });

  it('should throw ApiError when response indicates failure in body', async () => {
    const { apiClient, ApiError } = await import('../../services/api');
    const errorData = {
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found',
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(errorData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(errorData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await expect(apiClient('/api/projects/123')).rejects.toThrow(ApiError);
    await expect(apiClient('/api/projects/123')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Project not found',
    });
  });
});

describe('api convenience methods', () => {
  it('api.get should call apiClient with GET method', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: [], error: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.get('/api/projects');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('api.post should call apiClient with POST method and body', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1' }, error: null };
    const body = { name: 'New Project' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.post('/api/projects', body);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
  });

  it('api.put should call apiClient with PUT method and body', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: { id: '1' }, error: null };
    const body = { name: 'Updated Project' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.put('/api/projects/1', body);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(body),
      })
    );
  });

  it('api.delete should call apiClient with DELETE method', async () => {
    const { api } = await import('../../services/api');
    const mockData = { success: true, data: null, error: null };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    await api.delete('/api/projects/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
