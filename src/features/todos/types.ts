export type Todo = {
  id: string;
  todo: string;
  isCompleted: boolean;
  createdAt: string;
};

export type CreateTodoInput = {
  todo: string;
};

export type UpdateTodoInput = {
  todo?: string;
  isCompleted?: boolean;
};

export type TodoQuery = {
  search?: string;
};

export type ApiErrorBody = {
  error: string;
  issues?: string[];
};

export const TODO_MAX_LENGTH = 500;
export const TODO_SEARCH_MAX_LENGTH = TODO_MAX_LENGTH;
