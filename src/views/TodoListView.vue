<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { ApiError, createTodo, deleteTodo, listTodos, updateTodo } from '@/api/client';
import type { Todo, TodoFilters, TodoPriority } from '@/api/types';
import TodoForm from '@/components/TodoForm.vue';

const todos = ref<Todo[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const completedFilter = ref<'all' | 'true' | 'false'>('all');
const priorityFilter = ref<'all' | TodoPriority>('all');
const dueDateFilter = ref('');
const formKey = ref(0);
const filters = reactive<TodoFilters>({ page: 1, limit: 20 });
const meta = reactive({ page: 1, limit: 20, total: 0, totalPages: 0 });

function formatDate(value: string | null): string {
  if (!value) {
    return 'Sans échéance';
  }

  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}

async function loadTodos(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const response = await listTodos(filters);
    todos.value = response.items;
    Object.assign(meta, response.meta);
  } catch (cause: unknown) {
    error.value = cause instanceof ApiError ? cause.message : 'Impossible de charger les tâches.';
  } finally {
    loading.value = false;
  }
}

watch([completedFilter, priorityFilter, dueDateFilter], () => {
  filters.completed =
    completedFilter.value === 'all' ? undefined : completedFilter.value === 'true';
  filters.priority = priorityFilter.value === 'all' ? undefined : priorityFilter.value;
  filters.dueDate = dueDateFilter.value || undefined;
  filters.page = 1;
  void loadTodos();
});

onMounted(() => {
  void loadTodos();
});

async function addTodo(input: {
  title: string;
  completed?: boolean;
  priority: TodoPriority;
  dueDate: string | null;
}): Promise<void> {
  error.value = null;

  try {
    await createTodo(input);
    formKey.value += 1;
    await loadTodos();
  } catch (cause: unknown) {
    error.value = cause instanceof ApiError ? cause.message : 'Impossible de créer la tâche.';
  }
}

async function toggleTodo(todo: Todo): Promise<void> {
  try {
    await updateTodo(todo.id, { completed: !todo.completed });
    await loadTodos();
  } catch (cause: unknown) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Impossible de mettre à jour la tâche.';
  }
}

async function removeTodo(todo: Todo): Promise<void> {
  if (!window.confirm(`Supprimer « ${todo.title} » ?`)) {
    return;
  }

  try {
    await deleteTodo(todo.id);
    await loadTodos();
  } catch (cause: unknown) {
    error.value = cause instanceof ApiError ? cause.message : 'Impossible de supprimer la tâche.';
  }
}

function goToPage(page: number): void {
  if (page < 1 || page > meta.totalPages || page === filters.page) {
    return;
  }

  filters.page = page;
  void loadTodos();
}
</script>

<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">Votre espace</p>
      <h1>Mes tâches</h1>
      <p class="muted">Gardez le cap sur ce qui compte aujourd’hui.</p>
    </div>
    <span class="count-badge">{{ meta.total }} tâche{{ meta.total > 1 ? 's' : '' }}</span>
  </section>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <h2>Ajouter une tâche</h2>
        <p class="muted">Un titre suffit, vous pourrez compléter les détails plus tard.</p>
      </div>
    </div>
    <TodoForm :key="formKey" @submit="addTodo" />
  </section>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <h2>Liste des tâches</h2>
        <p class="muted">Filtrez et mettez à jour vos tâches directement.</p>
      </div>
      <div class="filters" aria-label="Filtres">
        <label>
          État
          <select v-model="completedFilter">
            <option value="all">Toutes</option>
            <option value="false">À faire</option>
            <option value="true">Terminées</option>
          </select>
        </label>
        <label>
          Priorité
          <select v-model="priorityFilter">
            <option value="all">Toutes</option>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </label>
        <label>
          Échéance
          <input v-model="dueDateFilter" type="date" />
        </label>
      </div>
    </div>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <p v-if="loading" class="empty-state">Chargement des tâches…</p>
    <p v-else-if="todos.length === 0" class="empty-state">Aucune tâche pour ces filtres.</p>

    <ul v-else class="todo-list">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
      >
        <input
          :aria-label="`Marquer ${todo.title} comme terminée`"
          :checked="todo.completed"
          type="checkbox"
          @change="toggleTodo(todo)"
        />
        <div class="todo-content">
          <strong>{{ todo.title }}</strong>
          <span class="todo-details">
            <span class="priority" :class="`priority-${todo.priority}`">{{ todo.priority }}</span>
            <span>{{ formatDate(todo.dueDate) }}</span>
            <span>Créée le {{ formatCreatedAt(todo.createdAt) }}</span>
          </span>
        </div>
        <div class="todo-actions">
          <RouterLink
            class="button button-quiet"
            :to="{ name: 'todo-edit', params: { id: todo.id } }"
          >
            Modifier
          </RouterLink>
          <button class="button button-danger" type="button" @click="removeTodo(todo)">
            Supprimer
          </button>
        </div>
      </li>
    </ul>

    <nav v-if="meta.totalPages > 1" class="pagination" aria-label="Pagination">
      <button
        class="button button-quiet"
        :disabled="meta.page === 1"
        @click="goToPage(meta.page - 1)"
      >
        Précédente
      </button>
      <span>Page {{ meta.page }} sur {{ meta.totalPages }}</span>
      <button
        class="button button-quiet"
        :disabled="meta.page === meta.totalPages"
        @click="goToPage(meta.page + 1)"
      >
        Suivante
      </button>
    </nav>
  </section>
</template>
