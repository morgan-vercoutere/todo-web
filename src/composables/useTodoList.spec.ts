import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import * as apiClient from '@/api/client';
import type { Todo, TodoFormValues } from '@/api/types';
import { useTodoList } from './useTodoList';

enableAutoUnmount(afterEach);

const todo: Todo = {
  id: 'todo-1',
  title: 'Préparer la démo',
  completed: false,
  priority: 'medium',
  dueDate: '2026-09-19',
  createdAt: '2026-09-19T08:30:00.000Z',
};

const input: TodoFormValues = {
  title: 'Nouvelle tâche',
  completed: false,
  priority: 'high',
  dueDate: null,
};

const Harness = defineComponent({
  setup() {
    return useTodoList();
  },
  template: '<div />',
});

async function mountHarness(query = '') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Harness }],
  });
  await router.push(`/${query}`);
  await router.isReady();
  const wrapper = mount(Harness, { global: { plugins: [router] } });
  return { router, wrapper };
}

function response(items: Todo[] = [todo]) {
  return {
    items,
    meta: { page: 1, limit: 20, total: items.length, totalPages: items.length ? 1 : 0 },
  };
}

describe('useTodoList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates filters from the URL and writes changes back to it', async () => {
    vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response());
    const { router, wrapper } = await mountHarness(
      '?completed=true&priority=high&dueDate=2026-09-19&page=2',
    );
    await flushPromises();

    expect(wrapper.vm.state.completed).toBe('true');
    expect(wrapper.vm.state.priority).toBe('high');
    expect(wrapper.vm.state.page).toBe(2);

    wrapper.vm.state.priority = 'low';
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({
      completed: 'true',
      dueDate: '2026-09-19',
      priority: 'low',
    });
  });

  it.each([
    { query: '', state: 'all', urgent: undefined },
    { query: '?urgent=true', state: 'true', urgent: true },
    { query: '?urgent=false', state: 'false', urgent: false },
    { query: '?urgent=invalid', state: 'all', urgent: undefined },
    { query: '?urgent', state: 'all', urgent: undefined },
    { query: '?urgent=false&urgent=true', state: 'false', urgent: false },
  ])('hydrates urgency from $query', async ({ query, state, urgent }) => {
    const list = vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response());
    const { wrapper } = await mountHarness(query);
    await flushPromises();

    expect(wrapper.vm.state.urgent).toBe(state);
    expect(list).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ urgent, page: 1, limit: 20 }),
    );
  });

  it('round-trips urgency through the URL and resets pagination without clearing other filters', async () => {
    const list = vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response());
    const { router, wrapper } = await mountHarness(
      '?completed=false&priority=high&dueDate=2026-09-19&page=2&limit=10',
    );
    await flushPromises();

    for (const urgent of ['true', 'false', 'all'] as const) {
      wrapper.vm.state.urgent = urgent;
      await flushPromises();

      expect(router.currentRoute.value.query).toEqual({
        completed: 'false',
        priority: 'high',
        dueDate: '2026-09-19',
        limit: '10',
        ...(urgent === 'all' ? {} : { urgent }),
      });
      expect(list).toHaveBeenLastCalledWith({
        completed: false,
        priority: 'high',
        dueDate: '2026-09-19',
        page: 1,
        limit: 10,
        urgent: urgent === 'all' ? undefined : urgent === 'true',
      });
    }
    expect(list).toHaveBeenCalledTimes(4);
  });

  it('updates urgency when navigating to another URL', async () => {
    const list = vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response());
    const { router, wrapper } = await mountHarness('?urgent=true');
    await flushPromises();

    await router.push('/?urgent=false');
    await flushPromises();
    expect(wrapper.vm.state.urgent).toBe('false');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ urgent: false }));

    await router.push('/');
    await flushPromises();
    expect(wrapper.vm.state.urgent).toBe('all');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ urgent: undefined }));
  });

  it('keeps the latest urgency response when an older request fails', async () => {
    let rejectFirst!: (reason: Error) => void;
    const firstResponse = new Promise<ReturnType<typeof response>>((_, reject) => {
      rejectFirst = reject;
    });
    vi.spyOn(apiClient, 'listTodos')
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce(response([{ ...todo, priority: 'high' }]));
    const { wrapper } = await mountHarness();
    expect(wrapper.vm.loading).toBe(true);

    wrapper.vm.state.urgent = 'true';
    await flushPromises();
    rejectFirst(new Error('Stale request'));
    await flushPromises();

    expect(wrapper.vm.todos).toEqual([{ ...todo, priority: 'high' }]);
    expect(wrapper.vm.loading).toBe(false);
    expect(wrapper.vm.error).toBeNull();
  });

  it.each([
    { urgent: 'true', priority: 'high', visible: true },
    { urgent: 'true', priority: 'low', visible: false },
    { urgent: 'true', priority: 'medium', visible: false },
    { urgent: 'false', priority: 'high', visible: false },
    { urgent: 'false', priority: 'low', visible: true },
    { urgent: 'false', priority: 'medium', visible: true },
  ] as const)(
    'respects urgent=$urgent during optimistic creation with priority=$priority',
    async ({ urgent, priority, visible }) => {
      const list = vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response([]));
      let resolveCreate!: (value: Todo) => void;
      vi.spyOn(apiClient, 'createTodo').mockReturnValue(
        new Promise<Todo>((resolve) => {
          resolveCreate = resolve;
        }),
      );
      const { wrapper } = await mountHarness(`?urgent=${urgent}`);
      await flushPromises();

      const creation = wrapper.vm.addTodo({ ...input, priority });
      expect(wrapper.vm.todos).toHaveLength(visible ? 1 : 0);
      expect(wrapper.vm.meta.total).toBe(visible ? 1 : 0);
      resolveCreate({ ...todo, priority, dueDate: null });
      await creation;
      expect(list).toHaveBeenCalledTimes(visible ? 1 : 2);
      expect(wrapper.vm.todos).toHaveLength(visible ? 1 : 0);
    },
  );
  it('ignores an older response when filters change quickly', async () => {
    let resolveFirst!: (value: ReturnType<typeof response>) => void;
    const firstResponse = new Promise<ReturnType<typeof response>>((resolve) => {
      resolveFirst = resolve;
    });
    vi.spyOn(apiClient, 'listTodos')
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce(response([{ ...todo, priority: 'high' }]));
    const { wrapper } = await mountHarness();

    wrapper.vm.state.priority = 'high';
    await flushPromises();
    resolveFirst(response());
    await flushPromises();

    expect(wrapper.vm.todos).toEqual([{ ...todo, priority: 'high' }]);
  });

  it('rolls back an optimistic toggle when the API rejects it', async () => {
    vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response());
    vi.spyOn(apiClient, 'updateTodo').mockRejectedValue(new apiClient.ApiError(500, 'Échec'));
    const { wrapper } = await mountHarness();
    await flushPromises();

    await wrapper.vm.toggleTodo(wrapper.vm.todos[0]);

    expect(wrapper.vm.todos[0].completed).toBe(false);
    expect(wrapper.vm.actionError).toBe('Échec');
    expect(wrapper.vm.isPending('toggle:todo-1')).toBe(false);
  });

  it('rolls back an optimistic deletion when the API rejects it', async () => {
    vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(apiClient, 'deleteTodo').mockRejectedValue(new apiClient.ApiError(500, 'Échec'));
    const { wrapper } = await mountHarness();
    await flushPromises();

    await wrapper.vm.removeTodo(wrapper.vm.todos[0]);

    expect(wrapper.vm.todos).toEqual([todo]);
    expect(wrapper.vm.meta.total).toBe(1);
    expect(wrapper.vm.actionError).toBe('Échec');
  });

  it('replaces an optimistic creation with the server response', async () => {
    vi.spyOn(apiClient, 'listTodos').mockResolvedValue(response([]));
    let resolveCreate!: (value: Todo) => void;
    vi.spyOn(apiClient, 'createTodo').mockReturnValue(
      new Promise<Todo>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const { wrapper } = await mountHarness();
    await flushPromises();

    const creation = wrapper.vm.addTodo(input);
    await flushPromises();
    expect(wrapper.vm.isPending('create')).toBe(true);
    expect(wrapper.vm.todos[0].id).toContain('optimistic-');

    resolveCreate({ ...todo, title: input.title, priority: input.priority, dueDate: null });
    await creation;

    expect(wrapper.vm.todos).toEqual([
      { ...todo, title: input.title, priority: input.priority, dueDate: null },
    ]);
    expect(wrapper.vm.isPending('create')).toBe(false);
  });
});
