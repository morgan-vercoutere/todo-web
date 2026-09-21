import { afterEach, describe, expect, it, vi } from 'vitest';
import { listTodos } from './client';

describe('Todo API client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serializes the documented filters and returns the paginated response', async () => {
    const response = {
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));

    await expect(
      listTodos({
        completed: true,
        priority: 'high',
        dueDate: '2026-09-19',
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual(response);

    const [request] = fetchMock.mock.calls[0] ?? [];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe(
      'http://localhost:3000/todos?completed=true&priority=high&dueDate=2026-09-19&page=1&limit=20',
    );
    expect((request as Request).method).toBe('GET');
  });
});
