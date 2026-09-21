<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { Todo, TodoPriority } from '@/api/types';

const props = withDefaults(
  defineProps<{
    todo?: Todo | null;
    submitLabel?: string;
  }>(),
  {
    todo: null,
    submitLabel: 'Ajouter',
  },
);

const emit = defineEmits<{
  submit: [
    {
      title: string;
      completed?: boolean;
      priority: TodoPriority;
      dueDate: string | null;
    },
  ];
}>();

const form = reactive({
  title: '',
  completed: false,
  priority: 'medium' as TodoPriority,
  dueDate: '',
});

function syncForm(todo: Todo | null): void {
  form.title = todo?.title ?? '';
  form.completed = todo?.completed ?? false;
  form.priority = todo?.priority ?? 'medium';
  form.dueDate = todo?.dueDate ?? '';
}

watch(() => props.todo, syncForm, { immediate: true });

function submit(): void {
  emit('submit', {
    title: form.title.trim(),
    completed: form.completed,
    priority: form.priority,
    dueDate: form.dueDate || null,
  });
}
</script>

<template>
  <form class="todo-form" @submit.prevent="submit">
    <label>
      Titre
      <input v-model="form.title" required maxlength="200" placeholder="Ex. Préparer la démo" />
    </label>

    <div class="form-grid">
      <label>
        Priorité
        <select v-model="form.priority">
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </label>

      <label>
        Échéance
        <input v-model="form.dueDate" type="date" />
      </label>
    </div>

    <label v-if="todo">
      <span class="checkbox-label">
        <input v-model="form.completed" type="checkbox" />
        Terminée
      </span>
    </label>

    <button class="button button-primary" type="submit">{{ submitLabel }}</button>
  </form>
</template>
