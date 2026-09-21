import type { TodoPriority } from '@/api/types';

export const priorityLabels: Record<TodoPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

export function formatPriority(priority: TodoPriority): string {
  return priorityLabels[priority];
}

export function formatDate(value: string | null): string {
  if (!value) {
    return 'Sans échéance';
  }

  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
}
