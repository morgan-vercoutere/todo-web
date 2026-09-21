<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink class="brand" to="/">Todo manager</RouterLink>
      <span class="brand-subtitle">Simple, visible, actionable</span>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
