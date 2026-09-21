<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { Todo, TodoFormValues, TodoPriority } from '@/api/types';

const props = withDefaults(
  defineProps<{
    todo?: Todo | null;
    submitLabel?: string;
    disabled?: boolean;
  }>(),
  {
    todo: null,
    submitLabel: 'Ajouter',
    disabled: false,
  },
);

const emit = defineEmits<{
  submit: [values: TodoFormValues];
}>();

const defaultPriority: TodoPriority = 'medium';
const form = reactive<{
  title: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate: string;
}>({
  title: '',
  completed: false,
  priority: defaultPriority,
  dueDate: '',
});
const validationError = ref<string | null>(null);

function syncForm(todo: Todo | null): void {
  form.title = todo?.title ?? '';
  form.completed = todo?.completed ?? false;
  form.priority = todo?.priority ?? defaultPriority;
  form.dueDate = todo?.dueDate ?? '';
  validationError.value = null;
}

watch(() => props.todo, syncForm, { immediate: true });

function submit(): void {
  const title = form.title.trim();
  if (!title) {
    validationError.value = 'Le titre est obligatoire.';
    return;
  }

  validationError.value = null;
  emit('submit', {
    title,
    completed: form.completed,
    priority: form.priority,
    dueDate: form.dueDate || null,
  });
}

function clearValidationError(): void {
  validationError.value = null;
}
</script>

<template>
  <form class="todo-form" @submit.prevent="submit">
    <label for="todo-title">
      Titre
      <input
        id="todo-title"
        v-model="form.title"
        :aria-describedby="validationError ? 'todo-title-error' : undefined"
        :aria-invalid="validationError ? 'true' : undefined"
        :disabled="disabled"
        required
        maxlength="200"
        placeholder="Ex. Préparer la démo"
        @input="clearValidationError"
      />
    </label>
    <p v-if="validationError" id="todo-title-error" class="field-error" role="alert">
      {{ validationError }}
    </p>

    <div class="form-grid">
      <label for="todo-priority">
        Priorité
        <select id="todo-priority" v-model="form.priority" :disabled="disabled">
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </label>

      <label for="todo-due-date">
        Échéance
        <input id="todo-due-date" v-model="form.dueDate" :disabled="disabled" type="date" />
      </label>
    </div>

    <label v-if="todo" for="todo-completed">
      <span class="checkbox-label">
        <input id="todo-completed" v-model="form.completed" :disabled="disabled" type="checkbox" />
        Terminée
      </span>
    </label>

    <button class="button button-primary" type="submit" :disabled="disabled">
      {{ disabled ? 'Enregistrement…' : submitLabel }}
    </button>
  </form>
</template>
