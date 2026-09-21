import { createRouter, createWebHistory } from 'vue-router';
import TodoEditView from './views/TodoEditView.vue';
import TodoListView from './views/TodoListView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'todos',
      component: TodoListView,
      meta: { title: 'Mes tâches' },
    },
    {
      path: '/todos/:id/edit',
      name: 'todo-edit',
      component: TodoEditView,
      props: true,
      meta: { title: 'Modifier une tâche' },
    },
  ],
});

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Todo'} - Todo`;
  requestAnimationFrame(() => {
    document.querySelector('h1')?.focus();
  });
});

export default router;
