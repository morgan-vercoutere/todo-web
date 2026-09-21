import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import * as apiClient from '@/api/client';
import TodoEditView from './TodoEditView.vue';

enableAutoUnmount(afterEach);

const todo = {
  id: 'todo-1',
  title: 'Préparer la démo',
  completed: false,
  priority: 'medium' as const,
  dueDate: null,
  createdAt: '2026-09-19T08:30:00.000Z',
};

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'todos', component: { template: '<div />' } },
      { path: '/todos/:id/edit', component: TodoEditView, props: true },
    ],
  });
  await router.push('/todos/todo-1/edit');
  await router.isReady();

  const wrapper = mount(TodoEditView, {
    global: {
      plugins: [router],
      stubs: { RouterLink: true },
    },
    props: { id: todo.id },
  });
  return { router, wrapper };
}

describe('TodoEditView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and submits the edited todo', async () => {
    vi.spyOn(apiClient, 'getTodo').mockResolvedValue(todo);
    vi.spyOn(apiClient, 'updateTodo').mockResolvedValue({ ...todo, title: 'Titre modifié' });
    const { router, wrapper } = await mountView();
    await flushPromises();

    await wrapper.get('#todo-title').setValue('Titre modifié');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(apiClient.updateTodo).toHaveBeenCalledWith('todo-1', {
      title: 'Titre modifié',
      completed: false,
      priority: 'medium',
      dueDate: null,
    });
    expect(router.currentRoute.value.name).toBe('todos');
  });

  it('shows an API error instead of rendering an empty form', async () => {
    vi.spyOn(apiClient, 'getTodo').mockRejectedValue(
      new apiClient.ApiError(404, 'Tâche introuvable'),
    );
    const { wrapper } = await mountView();
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe('Tâche introuvable');
    expect(wrapper.find('form').exists()).toBe(false);
  });
});
