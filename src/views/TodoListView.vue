<script setup lang="ts">
import TodoForm from '@/components/TodoForm.vue';
import TodoFilters from '@/components/TodoFilters.vue';
import Pagination from '@/components/Pagination.vue';
import TodoItem from '@/components/TodoItem.vue';
import { useTodoList } from '@/composables/useTodoList';

const {
  todos,
  meta,
  loading,
  error,
  actionError,
  isPending,
  state,
  addTodo,
  toggleTodo,
  removeTodo,
  goToPage,
} = useTodoList();
</script>

<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">Votre espace</p>
      <h1 tabindex="-1">Mes tâches</h1>
      <p class="muted">Gardez le cap sur ce qui compte aujourd’hui.</p>
    </div>
    <span class="count-badge" aria-live="polite">
      {{ meta.total }} tâche{{ meta.total > 1 ? 's' : '' }}
    </span>
  </section>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <h2>Ajouter une tâche</h2>
        <p class="muted">Un titre suffit, vous pourrez compléter les détails plus tard.</p>
      </div>
    </div>
    <TodoForm :disabled="isPending('create')" @submit="addTodo" />
  </section>

  <section class="panel" :aria-busy="loading">
    <div class="panel-heading">
      <div>
        <h2>Liste des tâches</h2>
        <p class="muted">Filtrez et mettez à jour vos tâches directement.</p>
      </div>
      <TodoFilters
        v-model:completed="state.completed"
        v-model:urgent="state.urgent"
        v-model:due-date="state.dueDate"
        v-model:priority="state.priority"
      />
    </div>

    <p v-if="error" class="alert alert-error" role="alert">{{ error }}</p>
    <p v-if="actionError" class="alert alert-error" role="alert">{{ actionError }}</p>
    <p v-if="loading" class="empty-state" role="status" aria-live="polite">
      Chargement des tâches…
    </p>
    <p v-else-if="todos.length === 0" class="empty-state">Aucune tâche pour ces filtres.</p>

    <ul v-else class="todo-list">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :pending="isPending(`toggle:${todo.id}`) || isPending(`delete:${todo.id}`)"
        :todo="todo"
        @remove="removeTodo"
        @toggle="toggleTodo"
      />
    </ul>

    <Pagination
      :disabled="loading"
      :page="meta.page"
      :total-pages="meta.totalPages"
      @change="goToPage"
    />
  </section>
</template>
