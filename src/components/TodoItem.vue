<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { Todo } from '@/api/types';
import { formatCreatedAt, formatDate, formatPriority } from '@/utils/todoPresentation';

const props = defineProps<{
  todo: Todo;
  pending?: boolean;
}>();

const emit = defineEmits<{
  toggle: [todo: Todo];
  remove: [todo: Todo];
}>();
</script>

<template>
  <li class="todo-item" :class="{ completed: todo.completed }">
    <input
      :id="`todo-${todo.id}`"
      :aria-label="
        todo.completed ? `Rouvrir ${todo.title}` : `Marquer ${todo.title} comme terminée`
      "
      :checked="todo.completed"
      :disabled="pending"
      type="checkbox"
      @change="emit('toggle', props.todo)"
    />
    <div class="todo-content">
      <strong>{{ todo.title }}</strong>
      <span class="todo-details">
        <span
          class="priority"
          :class="`priority-${todo.priority}`"
          :aria-label="`Priorité ${formatPriority(todo.priority)}`"
        >
          {{ formatPriority(todo.priority) }}
        </span>
        <span>{{ formatDate(todo.dueDate) }}</span>
        <span>Créée le {{ formatCreatedAt(todo.createdAt) }}</span>
      </span>
    </div>
    <div class="todo-actions">
      <RouterLink
        class="button button-quiet"
        :to="{ name: 'todo-edit', params: { id: todo.id } }"
        :aria-label="`Modifier ${todo.title}`"
      >
        Modifier
      </RouterLink>
      <button
        class="button button-danger"
        type="button"
        :disabled="pending"
        :aria-label="`Supprimer ${todo.title}`"
        @click="emit('remove', props.todo)"
      >
        Supprimer
      </button>
    </div>
  </li>
</template>
