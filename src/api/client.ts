import createClient from 'openapi-fetch';
import type { paths } from './generated';
import type {
  CreateTodoInput,
  Todo,
  TodoFilters,
  TodoListResponse,
  UpdateTodoInput,
} from './types';

const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  fetch: (...args) => globalThis.fetch(...args),
});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Une erreur est survenue avec l’API.';
}

async function unwrap<T>(response: Response, data: T | undefined, error: unknown): Promise<T> {
  if (!response.ok || error !== undefined) {
    throw new ApiError(response.status, errorMessage(error));
  }

  if (data === undefined) {
    throw new ApiError(response.status, 'La réponse de l’API est vide.');
  }

  return data;
}

export async function listTodos(filters: TodoFilters): Promise<TodoListResponse> {
  const result = await api.GET('/todos', { params: { query: filters } });
  return unwrap(result.response, result.data, result.error);
}

export async function getTodo(id: string): Promise<Todo> {
  const result = await api.GET('/todos/{id}', { params: { path: { id } } });
  return unwrap(result.response, result.data, result.error);
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const result = await api.POST('/todos', { body: input });
  return unwrap(result.response, result.data, result.error);
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
  const result = await api.PATCH('/todos/{id}', {
    params: { path: { id } },
    body: input,
  });
  return unwrap(result.response, result.data, result.error);
}

export async function deleteTodo(id: string): Promise<void> {
  const result = await api.DELETE('/todos/{id}', { params: { path: { id } } });

  if (!result.response.ok || result.error !== undefined) {
    throw new ApiError(result.response.status, errorMessage(result.error));
  }
}
