import type { components, paths } from './generated';

export type TodoPriority = components['schemas']['Priority'];
export type Todo = components['schemas']['TodoEntity'];
export type TodoListMeta = components['schemas']['TodoListMetaEntity'];
export type TodoListResponse = components['schemas']['TodoListResponseEntity'];
export type CreateTodoInput = components['schemas']['CreateTodoDto'];
export type UpdateTodoInput = components['schemas']['UpdateTodoDto'];
export type TodoFilters = NonNullable<paths['/todos']['get']['parameters']['query']>;

export type TodoFormValues = {
  title: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate: string | null;
};
