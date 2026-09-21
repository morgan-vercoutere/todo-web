import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import * as apiClient from '@/api/client';
import type { Todo, TodoFormValues } from '@/api/types';
import { useTodoList } from './useTodoList';

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
