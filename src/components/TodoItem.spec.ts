import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TodoItem from './TodoItem.vue';

const todo = {
  id: '1',
  title: 'Préparer la démo',
  completed: true,
  priority: 'high' as const,
  dueDate: null,
  createdAt: '2026-09-19T08:30:00.000Z',
};

describe('TodoItem', () => {
  it('exposes the translated priority and state-aware checkbox label', () => {
    const wrapper = mount(TodoItem, {
      global: {
        stubs: { RouterLink: true },
      },
      props: { todo },
    });

    expect(wrapper.get('.priority').text()).toBe('Haute');
    expect(wrapper.get('input[type="checkbox"]').attributes('aria-label')).toBe(
      'Rouvrir Préparer la démo',
    );
  });
});
