import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TodoForm from './TodoForm.vue';

describe('TodoForm', () => {
  it('trims the title and converts an empty due date to null', async () => {
    const wrapper = mount(TodoForm);

    await wrapper.get('#todo-title').setValue('  Préparer la démo  ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          title: 'Préparer la démo',
          completed: false,
          priority: 'medium',
          dueDate: null,
        },
      ],
    ]);
  });

  it('rejects a title containing only whitespace', async () => {
    const wrapper = mount(TodoForm);

    await wrapper.get('#todo-title').setValue('   ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.get('[role="alert"]').text()).toBe('Le titre est obligatoire.');
    expect(wrapper.get('#todo-title').attributes('aria-invalid')).toBe('true');
  });
});
