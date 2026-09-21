<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ApiError, getTodo, updateTodo } from '@/api/client';
import type { Todo, TodoPriority } from '@/api/types';
import TodoForm from '@/components/TodoForm.vue';

const route = useRoute();
const router = useRouter();
const todo = ref<Todo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    todo.value = await getTodo(String(route.params.id));
  } catch (cause: unknown) {
    error.value = cause instanceof ApiError ? cause.message : 'Impossible de charger la tâche.';
  } finally {
    loading.value = false;
  }
});

async function saveTodo(input: {
  title: string;
  completed?: boolean;
  priority: TodoPriority;
  dueDate: string | null;
}): Promise<void> {
  if (!todo.value) {
    return;
  }

  try {
    await updateTodo(todo.value.id, input);
    await router.push({ name: 'todos' });
  } catch (cause: unknown) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Impossible de mettre à jour la tâche.';
  }
}
</script>

<template>
  <section class="page-heading">
    <div>
      <RouterLink class="back-link" to="/">← Retour aux tâches</RouterLink>
      <p class="eyebrow">Mise à jour</p>
      <h1>Modifier la tâche</h1>
    </div>
  </section>

  <section class="panel narrow-panel">
    <p v-if="loading" class="empty-state">Chargement de la tâche…</p>
    <p v-else-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <TodoForm v-else-if="todo" :todo="todo" submit-label="Enregistrer" @submit="saveTodo" />
  </section>
</template>
