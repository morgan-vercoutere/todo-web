<script setup lang="ts">
defineProps<{
  page: number;
  totalPages: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [page: number];
}>();
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination">
    <button
      class="button button-quiet"
      type="button"
      :disabled="disabled || page === 1"
      @click="emit('change', page - 1)"
    >
      Précédente
    </button>
    <span aria-live="polite">Page {{ page }} sur {{ totalPages }}</span>
    <button
      class="button button-quiet"
      type="button"
      :disabled="disabled || page === totalPages"
      @click="emit('change', page + 1)"
    >
      Suivante
    </button>
  </nav>
</template>
