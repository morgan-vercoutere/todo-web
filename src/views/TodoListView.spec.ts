import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '@/api/client';
import TodoListView from './TodoListView.vue';

enableAutoUnmount(afterEach);

describe('Todo list completed filter', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'listTodos').mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 40, totalPages: 2 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mountView() {
    return mount(TodoListView, {
      global: { stubs: { TodoForm: true, RouterLink: true } },
    });
  }

  it('offers Toutes, À faire and Terminées and loads all todos by default', async () => {
    const wrapper = mountView();
    await flushPromises();

    const select = wrapper.get<HTMLSelectElement>('.filters select');
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
    const wrapper = mountView();
    await flushPromises();

    await wrapper.get('.filters select').setValue(value);
    await flushPromises();

    expect(apiClient.listTodos).toHaveBeenCalledTimes(2);
    expect(apiClient.listTodos).toHaveBeenLastCalledWith(
      expect.objectContaining({ completed, page: 1, limit: 20 }),
    );
  });

  it.each(['false', 'true'])(
    'clears completed when switching from %s back to Toutes',
    async (value) => {
      const wrapper = mountView();
      await flushPromises();
      const select = wrapper.get<HTMLSelectElement>('.filters select');

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
    const wrapper = mountView();
    await flushPromises();
    const completedSelect = wrapper.get('.filters select');
    const prioritySelect = wrapper.get('.filters label:nth-child(2) select');

    await prioritySelect.setValue('high');
    await wrapper.get('.filters input[type="date"]').setValue('2026-09-19');
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
});
