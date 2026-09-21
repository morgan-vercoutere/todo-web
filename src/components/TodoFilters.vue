<script setup lang="ts">
import type { TodoPriority } from '@/api/types';

type CompletedFilter = 'all' | 'true' | 'false';
type PriorityFilter = 'all' | TodoPriority;

defineProps<{
  completed: CompletedFilter;
  priority: PriorityFilter;
  dueDate: string;
}>();

const emit = defineEmits<{
  'update:completed': [value: CompletedFilter];
  'update:priority': [value: PriorityFilter];
  'update:dueDate': [value: string];
}>();
</script>

<template>
  <fieldset class="filters">
    <legend class="sr-only">Filtres</legend>
    <label for="filter-completed">
      État
      <select
        id="filter-completed"
        :value="completed"
        @change="
          emit('update:completed', ($event.target as HTMLSelectElement).value as CompletedFilter)
        "
      >
        <option value="all">Toutes</option>
        <option value="false">À faire</option>
        <option value="true">Terminées</option>
      </select>
    </label>
    <label for="filter-priority">
      Priorité
      <select
        id="filter-priority"
        :value="priority"
        @change="
          emit('update:priority', ($event.target as HTMLSelectElement).value as PriorityFilter)
        "
      >
        <option value="all">Toutes</option>
        <option value="low">Basse</option>
        <option value="medium">Moyenne</option>
        <option value="high">Haute</option>
      </select>
    </label>
    <label for="filter-due-date">
      Échéance
      <input
        id="filter-due-date"
        :value="dueDate"
        type="date"
        @input="emit('update:dueDate', ($event.target as HTMLInputElement).value)"
      />
    </label>
  </fieldset>
</template>
