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
    },
    {
      path: '/todos/:id/edit',
      name: 'todo-edit',
      component: TodoEditView,
      props: true,
    },
  ],
});

export default router;
