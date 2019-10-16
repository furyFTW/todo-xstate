import uuid from 'uuid-v4';
import {Todo, Todos} from '../../models/Todo';
import {Machine, assign, spawn} from 'xstate';
import * as todosMainState from './state';
import * as todosAction from './actions';
import * as todoState from '../todo/machine';
import * as todoAction from '../todo/actions';

const createTodo = (title: any): Todo => ({
  id: uuid(),
  title: title,
  completed: false,
});
const todosInit = {
  todo: '',
  todos: [],
};

export const todosMachine = Machine({
  id: 'todos',
  context: todosInit,
  initial: todosMainState.initializing_state,
  states: {
    [todosMainState.initializing_state]: {
      entry: assign({
        todos: ctx => {
          return ctx.todos.map(todo => ({
            ...todo,
            ref: spawn(todoState.todoMachine.withContext(todo)),
          }));
        },
      }),
      on: {
        '': todosMainState.all_state,
      },
    },
    [todosMainState.all_state]: {},
    [todosMainState.completed_state]: {},
    [todosMainState.active_state]: {},
  },
  on: {
    [todosAction.NEWTODO_CHANGED]: {
      actions: assign({
        todo: (ctx, e) => {
          return e.value;
        },
      }),
    },
    [todosAction.NEWTODO_COMMIT]: {
      actions: [
        assign({
          todo: '',
          todos: (ctx, e) => {
            const newTodo = createTodo(e.value.trim());
            return ctx.todos.concat({
              ...newTodo,
              ref: spawn(todoState.todoMachine.withContext(newTodo)),
            });
          },
        }),
        'persist',
      ],
      cond: (ctx, e) => e.value.trim().length,
    },
    [todosAction.TODO_COMMIT]: {
      actions: [
        assign({
          todos: (ctx, e) =>
            ctx.todos.map(todo => {
              return todo.id === e.todo.id
                ? {...todo, ...e.todo, ref: todo.ref}
                : todo;
            }),
        }),
        'persist',
      ],
    },
    [todosAction.TODO_DELETE]: {
      actions: [
        assign({
          todos: (ctx, e) => ctx.todos.filter(todo => todo.id !== e.id),
        }),
        'persist',
      ],
    },
    [todosAction.SHOW_ALL]: `.${todosMainState.all_state}`,
    [todosAction.SHOW_ACTIVE]: `.${todosMainState.active_state}`,
    [todosAction.SHOW_COMPLETED]: `.${todosMainState.completed_state}`,
    [todosAction.MARK_COMPLETE]: {
      actions: ctx => {
        ctx.todos.forEach((todo: any) =>
          todo.ref.send({type: todoAction.SET_COMPLETE_ACTION}),
        );
      },
    },
    [todosAction.MARK_ACTIVE]: {
      actions: ctx => {
        ctx.todos.forEach((todo: any) =>
          todo.ref.send({type: todoAction.SET_ACTIVE_ACTION}),
        );
      },
    },
    [todosAction.CLEAR_COMPLETED]: {
      actions: assign<Todos>({
        todos: ctx => ctx.todos.filter(todo => !todo.completed),
      }),
    },
  },
});
