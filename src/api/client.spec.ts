import { afterEach, describe, expect, it, vi } from 'vitest';
import { listTodos } from './client';

describe('Todo API client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([true, false])(
    'serializes completed=%s with the documented filters and returns the paginated response',
    async (completed) => {
      const response = {
        items: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));

      await expect(
        listTodos({
          completed,
          priority: 'high',
          dueDate: '2026-09-19',
          page: 1,
          limit: 20,
        }),
      ).resolves.toEqual(response);

      const [request] = fetchMock.mock.calls[0] ?? [];
      expect(request).toBeInstanceOf(Request);
      expect((request as Request).url).toBe(
        `http://localhost:3000/todos?completed=${completed}&priority=high&dueDate=2026-09-19&page=1&limit=20`,
      );
      expect((request as Request).method).toBe('GET');
    },
  );

  it.each([{}, { completed: undefined }])(
    'omits completed from the query string for all todos with %j',
    async (filters) => {
      const response = {
        items: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));

      await expect(listTodos({ ...filters, page: 1, limit: 20 })).resolves.toEqual(response);

      const [request] = fetchMock.mock.calls[0] ?? [];
      expect(request).toBeInstanceOf(Request);
      const url = new URL((request as Request).url);
      expect(url.searchParams.has('completed')).toBe(false);
      expect(url.href).toBe('http://localhost:3000/todos?page=1&limit=20');
      expect((request as Request).method).toBe('GET');
    },
  );
});
