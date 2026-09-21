<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Aller au contenu principal</a>
    <header class="app-header">
      <RouterLink class="brand" to="/">Todo manager</RouterLink>
      <span class="brand-subtitle">Simple, visible, actionable</span>
    </header>

    <main id="main-content" class="app-main">
      <RouterView />
    </main>
  </div>
</template>
