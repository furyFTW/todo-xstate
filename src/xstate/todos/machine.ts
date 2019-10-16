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

const onEntryInitState = assign({
  todos: ctx => {
    return ctx.todos.map(todo => ({
      ...todo,
      ref: spawn(todoState.todoMachine.withContext(todo)),
    }));
  },
});
const newTodoAction = assign({
  todo: '',
  todos: (ctx, e) => {
    const newTodo = createTodo(e.value.trim());
    return ctx.todos.concat({
      ...newTodo,
      ref: spawn(todoState.todoMachine.withContext(newTodo)),
    });
  },
});

const todoCommitAction = assign({
  todos: (ctx, e) =>
    ctx.todos.map(todo => {
      return todo.id === e.todo.id ? {...todo, ...e.todo, ref: todo.ref} : todo;
    }),
});
const todoDeleteAction = assign({
  todos: (ctx, e) => ctx.todos.filter(todo => todo.id !== e.id),
});
const sendChildrenAction = (type: {type: string}) => ctx => {
  ctx.todos.forEach((todo: any) => todo.ref.send(type));
};
const clearCompletedTodoAction = assign<Todos>({
  todos: ctx => ctx.todos.filter(todo => !todo.completed),
});

const newTodoChangedAction = assign({
  todo: (ctx, e) => e.value,
});

const newTodoGuard = (ctx, e) => e.value.trim().length;

const todosInitCtx = {
  todo: '',
  todos: [],
};

export const todosMachineConfig = {
  id: 'todos',
  context: todosInitCtx,
  initial: todosMainState.initializing_state,
  states: {
    [todosMainState.initializing_state]: {
      entry: onEntryInitState,
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
      actions: newTodoChangedAction,
    },
    [todosAction.NEWTODO_COMMIT]: {
      actions: [newTodoAction, 'persist'],
      cond: newTodoGuard,
    },
    [todosAction.TODO_COMMIT]: {
      actions: [todoCommitAction, 'persist'],
    },
    [todosAction.TODO_DELETE]: {
      actions: [todoDeleteAction, 'persist'],
    },
    [todosAction.SHOW_ALL]: `.${todosMainState.all_state}`,
    [todosAction.SHOW_ACTIVE]: `.${todosMainState.active_state}`,
    [todosAction.SHOW_COMPLETED]: `.${todosMainState.completed_state}`,
    [todosAction.MARK_COMPLETE]: {
      actions: sendChildrenAction({type: todoAction.SET_COMPLETE_ACTION}),
    },
    [todosAction.MARK_ACTIVE]: {
      actions: sendChildrenAction({type: todoAction.SET_ACTIVE_ACTION}),
    },
    [todosAction.CLEAR_COMPLETED]: {
      actions: clearCompletedTodoAction,
    },
  },
};

export const todosStateMachine = Machine<Todos>(todosMachineConfig);
