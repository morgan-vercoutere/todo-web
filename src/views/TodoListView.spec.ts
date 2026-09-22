import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import * as apiClient from '@/api/client';
import TodoListView from './TodoListView.vue';

enableAutoUnmount(afterEach);

describe('Todo list filters', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'listTodos').mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 40, totalPages: 2 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function mountView() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: TodoListView }],
    });
    await router.push('/');
    await router.isReady();

    return mount(TodoListView, {
      global: {
        plugins: [router],
        stubs: { TodoForm: true, RouterLink: true },
      },
    });
  }

  it('offers Toutes, À faire and Terminées and loads all todos by default', async () => {
    const wrapper = await mountView();
    await flushPromises();

    const select = wrapper.get<HTMLSelectElement>('#filter-completed');
    expect(
      select.findAll('option').map((option) => ({
        label: option.text(),
        value: option.element.value,
      })),
    ).toEqual([
      { label: 'Toutes', value: 'all' },
      { label: 'À faire', value: 'false' },
      { label: 'Terminées', value: 'true' },
    ]);
    expect(select.element.value).toBe('all');
    expect(apiClient.listTodos).toHaveBeenCalledExactlyOnceWith({ page: 1, limit: 20 });
  });

  it.each([
    { label: 'À faire', value: 'false', completed: false },
    { label: 'Terminées', value: 'true', completed: true },
  ])('requests completed=$completed when $label is selected', async ({ value, completed }) => {
    const wrapper = await mountView();
    await flushPromises();

    await wrapper.get('#filter-completed').setValue(value);
    await flushPromises();

    expect(apiClient.listTodos).toHaveBeenCalledTimes(2);
    expect(apiClient.listTodos).toHaveBeenLastCalledWith(
      expect.objectContaining({ completed, page: 1, limit: 20 }),
    );
  });

  it.each(['false', 'true'])(
    'clears completed when switching from %s back to Toutes',
    async (value) => {
      const wrapper = await mountView();
      await flushPromises();
      const select = wrapper.get<HTMLSelectElement>('#filter-completed');

      await select.setValue(value);
      await flushPromises();
      await select.setValue('all');
      await flushPromises();

      expect(select.element.value).toBe('all');
      expect(apiClient.listTodos).toHaveBeenCalledTimes(3);
      expect(apiClient.listTodos).toHaveBeenLastCalledWith(
        expect.objectContaining({ completed: undefined, page: 1, limit: 20 }),
      );
    },
  );

  it('resets pagination while preserving priority and due date when changing completed', async () => {
    const wrapper = await mountView();
    await flushPromises();
    const completedSelect = wrapper.get('#filter-completed');
    const prioritySelect = wrapper.get('#filter-priority');

    await prioritySelect.setValue('high');
    await wrapper.get('#filter-due-date').setValue('2026-09-19');
    await flushPromises();
    await wrapper.get('.pagination button:last-child').trigger('click');
    await flushPromises();
    expect(apiClient.listTodos).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));

    await completedSelect.setValue('false');
    await flushPromises();

    expect(apiClient.listTodos).toHaveBeenLastCalledWith({
      completed: false,
      priority: 'high',
      dueDate: '2026-09-19',
      page: 1,
      limit: 20,
    });
  });

  it('offers an accessible three-state urgency filter with Toutes selected by default', async () => {
    const wrapper = await mountView();
    await flushPromises();
    const select = wrapper.get<HTMLSelectElement>('#filter-urgent');

    expect(wrapper.get('label[for="filter-urgent"]').text()).toContain('Urgence');
    expect(
      select.findAll('option').map((option) => ({
        label: option.text(),
        value: option.element.value,
      })),
    ).toEqual([
      { label: 'Toutes', value: 'all' },
      { label: 'Urgentes', value: 'true' },
      { label: 'Non urgentes', value: 'false' },
    ]);
    expect(select.element.value).toBe('all');
    expect(apiClient.listTodos).toHaveBeenCalledExactlyOnceWith({ page: 1, limit: 20 });
  });

  it.each(['true', 'false'])(
    'requests urgent=%s, preserves it across pagination, and clears it for Toutes',
    async (value) => {
      const wrapper = await mountView();
      await flushPromises();
      const select = wrapper.get<HTMLSelectElement>('#filter-urgent');

      await select.setValue(value);
      await flushPromises();
      expect(apiClient.listTodos).toHaveBeenCalledTimes(2);
      expect(apiClient.listTodos).toHaveBeenLastCalledWith(
        expect.objectContaining({ urgent: value === 'true', page: 1 }),
      );

      await wrapper.get('.pagination button:last-child').trigger('click');
      await flushPromises();
      expect(apiClient.listTodos).toHaveBeenLastCalledWith(
        expect.objectContaining({ urgent: value === 'true', page: 2 }),
      );

      await select.setValue('all');
      await flushPromises();
      expect(select.element.value).toBe('all');
      expect(apiClient.listTodos).toHaveBeenLastCalledWith(
        expect.objectContaining({ urgent: undefined, page: 1 }),
      );
      expect(apiClient.listTodos).toHaveBeenCalledTimes(4);
    },
  );

  it('shows loading feedback and disables pagination while the urgency request is pending', async () => {
    const wrapper = await mountView();
    await flushPromises();
    let resolveList!: (value: Awaited<ReturnType<typeof apiClient.listTodos>>) => void;
    vi.mocked(apiClient.listTodos).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    await wrapper.get('#filter-urgent').setValue('true');
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe('Chargement des tâches…');
    expect(wrapper.get('.panel[aria-busy]').attributes('aria-busy')).toBe('true');
    expect(wrapper.get<HTMLButtonElement>('.pagination button:last-child').element.disabled).toBe(
      true,
    );

    resolveList({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await flushPromises();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Aucune tâche pour ces filtres.');
  });
});
