<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ApiError, getTodo, updateTodo } from '@/api/client';
import type { Todo, TodoFormValues } from '@/api/types';
import TodoForm from '@/components/TodoForm.vue';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const todo = ref<Todo | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
let loadVersion = 0;

async function loadTodo(id: string): Promise<void> {
  const version = ++loadVersion;
  loading.value = true;
  error.value = null;

  try {
    const loadedTodo = await getTodo(id);
    if (version === loadVersion) {
      todo.value = loadedTodo;
    }
  } catch (cause: unknown) {
    if (version === loadVersion) {
      error.value = cause instanceof ApiError ? cause.message : 'Impossible de charger la tâche.';
      todo.value = null;
    }
  } finally {
    if (version === loadVersion) {
      loading.value = false;
    }
  }
}

watch(
  () => props.id,
  (id) => void loadTodo(id),
  { immediate: true },
);

async function saveTodo(input: TodoFormValues): Promise<void> {
  if (!todo.value || saving.value) {
    return;
  }

  saving.value = true;
  error.value = null;
  try {
    todo.value = await updateTodo(todo.value.id, input);
    await router.push({ name: 'todos' });
  } catch (cause: unknown) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Impossible de mettre à jour la tâche.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="page-heading">
    <div>
      <RouterLink class="back-link" to="/">← Retour aux tâches</RouterLink>
      <p class="eyebrow">Mise à jour</p>
      <h1 tabindex="-1">Modifier la tâche</h1>
    </div>
  </section>

  <section class="panel narrow-panel" :aria-busy="loading || saving">
    <p v-if="loading" class="empty-state" role="status" aria-live="polite">
      Chargement de la tâche…
    </p>
    <p v-else-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <TodoForm
      v-else-if="todo"
      :disabled="saving"
      :todo="todo"
      submit-label="Enregistrer"
      @submit="saveTodo"
    />
  </section>
</template>
