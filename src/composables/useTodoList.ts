import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router';
import { ApiError, createTodo, deleteTodo, listTodos, updateTodo } from '@/api/client';
import type { Todo, TodoFilters, TodoFormValues, TodoListMeta } from '@/api/types';

export type CompletedFilter = 'all' | 'true' | 'false';
export type UrgentFilter = 'all' | 'true' | 'false' | 'invalid';
export type PriorityFilter = 'all' | Todo['priority'];

type ListState = {
  completed: CompletedFilter;
  urgent: UrgentFilter;
  invalidUrgent?: LocationQuery[string];
  priority: PriorityFilter;
  dueDate: string;
  page: number;
  limit: number;
};

const DEFAULT_LIMIT = 20;

function queryValue(value: LocationQuery[string]): string | undefined {
  return Array.isArray(value) ? (value[0] ?? undefined) : (value ?? undefined);
}

function positiveInteger(value: string | undefined, fallback: number, maximum?: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    return fallback;
  }

  return parsed;
}

function parseState(query: LocationQuery): ListState {
  const completed = queryValue(query.completed);
  const urgent = query.urgent;
  const invalidUrgent = urgent !== undefined && urgent !== 'true' && urgent !== 'false';
  const priority = queryValue(query.priority);
  const dueDate = queryValue(query.dueDate);

  return {
    completed: completed === 'true' || completed === 'false' ? completed : 'all',
    urgent: invalidUrgent ? 'invalid' : urgent === undefined ? 'all' : urgent,
    invalidUrgent: invalidUrgent ? urgent : undefined,
    priority: priority === 'low' || priority === 'medium' || priority === 'high' ? priority : 'all',
    dueDate: dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : '',
    page: positiveInteger(queryValue(query.page), 1),
    limit: positiveInteger(queryValue(query.limit), DEFAULT_LIMIT, 100),
  };
}

function serializeState(state: ListState): LocationQueryRaw {
  const query: LocationQueryRaw = {};

  if (state.completed !== 'all') {
    query.completed = state.completed;
  }
  if (state.urgent === 'invalid') {
    query.urgent = state.invalidUrgent;
  } else if (state.urgent !== 'all') {
    query.urgent = state.urgent;
  }
  if (state.priority !== 'all') {
    query.priority = state.priority;
  }
  if (state.dueDate) {
    query.dueDate = state.dueDate;
  }
  if (state.page > 1) {
    query.page = String(state.page);
  }
  if (state.limit !== DEFAULT_LIMIT) {
    query.limit = String(state.limit);
  }

  return query;
}

function queryKey(query: LocationQuery | LocationQueryRaw): string {
  return Object.entries(query)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : (value ?? '')}`)
    .join('&');
}

function matchesFilters(todo: Todo, state: ListState): boolean {
  return (
    state.urgent !== 'invalid' &&
    (state.completed === 'all' || todo.completed === (state.completed === 'true')) &&
    (state.urgent === 'all' || (todo.priority === 'high') === (state.urgent === 'true')) &&
    (state.priority === 'all' || todo.priority === state.priority) &&
    (!state.dueDate || todo.dueDate === state.dueDate)
  );
}

function totalPages(total: number, limit: number): number {
  return total === 0 ? 0 : Math.ceil(total / limit);
}

export function useTodoList() {
  const route = useRoute();
  const router = useRouter();
  const state = reactive<ListState>(parseState(route.query));
  const todos = ref<Todo[]>([]);
  const meta = ref<TodoListMeta>({ page: state.page, limit: state.limit, total: 0, totalPages: 0 });
  const loading = ref(false);
  const error = ref<string | null>(null);
  const actionError = ref<string | null>(null);
  const pendingActions = ref(new Set<string>());

  let requestVersion = 0;
  let lastQueryKey = queryKey(serializeState(state));

  function setPending(action: string, pending: boolean): void {
    const nextPendingActions = new Set(pendingActions.value);
    if (pending) {
      nextPendingActions.add(action);
    } else {
      nextPendingActions.delete(action);
    }
    pendingActions.value = nextPendingActions;
  }

  function isPending(action: string): boolean {
    return pendingActions.value.has(action);
  }

  function filters(): TodoFilters {
    if (state.urgent === 'invalid') {
      throw new ApiError(
        400,
        'Le paramètre urgent doit apparaître une seule fois avec la valeur true ou false. Choisissez une option du filtre Urgence pour corriger l’URL.',
      );
    }
    return {
      completed: state.completed === 'all' ? undefined : state.completed === 'true',
      urgent: state.urgent === 'all' ? undefined : state.urgent === 'true',
      priority: state.priority === 'all' ? undefined : state.priority,
      dueDate: state.dueDate || undefined,
      page: state.page,
      limit: state.limit,
    };
  }

  async function loadTodos(): Promise<void> {
    const version = ++requestVersion;
    loading.value = true;
    error.value = null;

    try {
      const response = await listTodos(filters());
      if (version !== requestVersion) {
        return;
      }

      todos.value = response.items;
      meta.value = response.meta;
    } catch (cause: unknown) {
      if (version !== requestVersion) {
        return;
      }

      todos.value = [];
      meta.value = { page: state.page, limit: state.limit, total: 0, totalPages: 0 };
      error.value = cause instanceof ApiError ? cause.message : 'Impossible de charger les tâches.';
    } finally {
      if (version === requestVersion) {
        loading.value = false;
      }
    }
  }

  function syncUrl(): void {
    const nextQuery = serializeState(state);
    const nextKey = queryKey(nextQuery);
    if (nextKey === lastQueryKey) {
      return;
    }

    lastQueryKey = nextKey;
    void router.replace({ query: nextQuery });
  }

  watch(
    () => [state.completed, state.urgent, state.priority, state.dueDate, state.page, state.limit],
    (current, previous) => {
      const filtersChanged =
        previous !== undefined &&
        current.slice(0, 4).some((value, index) => value !== previous[index]);
      if (filtersChanged && state.page !== 1) {
        state.page = 1;
        return;
      }

      syncUrl();
      void loadTodos();
    },
  );

  watch(
    () => route.fullPath,
    () => {
      const nextState = parseState(route.query);
      const nextKey = queryKey(serializeState(nextState));
      if (nextKey === lastQueryKey) {
        return;
      }

      Object.assign(state, nextState);
      lastQueryKey = nextKey;
      void loadTodos();
    },
  );

  onMounted(() => {
    void loadTodos();
  });

  async function addTodo(input: TodoFormValues): Promise<void> {
    const optimisticTodo: Todo = {
      id: `optimistic-${Date.now()}`,
      title: input.title,
      completed: input.completed,
      priority: input.priority,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
    };
    const visible = state.page === 1 && matchesFilters(optimisticTodo, state);

    actionError.value = null;
    setPending('create', true);
    if (visible) {
      todos.value = [optimisticTodo, ...todos.value];
      meta.value = {
        ...meta.value,
        total: meta.value.total + 1,
        totalPages: totalPages(meta.value.total + 1, meta.value.limit),
      };
    }

    try {
      const createdTodo = await createTodo(input);
      if (visible) {
        const index = todos.value.findIndex(({ id }) => id === optimisticTodo.id);
        if (index >= 0) {
          todos.value.splice(index, 1, createdTodo);
        }
      } else {
        await loadTodos();
      }
    } catch (cause: unknown) {
      if (visible) {
        todos.value = todos.value.filter(({ id }) => id !== optimisticTodo.id);
        meta.value = {
          ...meta.value,
          total: Math.max(0, meta.value.total - 1),
          totalPages: totalPages(Math.max(0, meta.value.total - 1), meta.value.limit),
        };
      }
      actionError.value =
        cause instanceof ApiError ? cause.message : 'Impossible de créer la tâche.';
    } finally {
      setPending('create', false);
    }
  }

  async function toggleTodo(todo: Todo): Promise<void> {
    const previousCompleted = todo.completed;
    todo.completed = !previousCompleted;
    actionError.value = null;
    setPending(`toggle:${todo.id}`, true);

    try {
      Object.assign(todo, await updateTodo(todo.id, { completed: todo.completed }));
    } catch (cause: unknown) {
      todo.completed = previousCompleted;
      actionError.value =
        cause instanceof ApiError ? cause.message : 'Impossible de mettre à jour la tâche.';
    } finally {
      setPending(`toggle:${todo.id}`, false);
    }
  }

  async function removeTodo(todo: Todo): Promise<void> {
    if (!window.confirm(`Supprimer « ${todo.title} » ?`)) {
      return;
    }

    const index = todos.value.findIndex(({ id }) => id === todo.id);
    if (index < 0) {
      return;
    }

    const previousTodos = [...todos.value];
    const previousMeta = { ...meta.value };
    todos.value = todos.value.filter(({ id }) => id !== todo.id);
    meta.value = {
      ...meta.value,
      total: Math.max(0, meta.value.total - 1),
      totalPages: totalPages(Math.max(0, meta.value.total - 1), meta.value.limit),
    };
    actionError.value = null;
    setPending(`delete:${todo.id}`, true);

    try {
      await deleteTodo(todo.id);
      if (state.page > Math.max(1, meta.value.totalPages)) {
        state.page = Math.max(1, meta.value.totalPages);
      }
    } catch (cause: unknown) {
      todos.value = previousTodos;
      meta.value = previousMeta;
      actionError.value =
        cause instanceof ApiError ? cause.message : 'Impossible de supprimer la tâche.';
    } finally {
      setPending(`delete:${todo.id}`, false);
    }
  }

  function goToPage(page: number): void {
    if (page < 1 || page > meta.value.totalPages || page === state.page) {
      return;
    }

    state.page = page;
  }

  return {
    todos,
    meta,
    loading,
    error,
    actionError,
    pendingActions,
    isPending,
    completedFilter: state,
    state,
    addTodo,
    toggleTodo,
    removeTodo,
    goToPage,
  };
}
