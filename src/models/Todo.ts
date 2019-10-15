export interface Todo {
  id: any;
  title: string;
  prevTitle?: string;
  completed?: boolean;
}
export interface Todos {
  todo: string;
  todos: Todo[];
}
