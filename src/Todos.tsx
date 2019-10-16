import React from 'react';
import cn from 'classnames';
import 'todomvc-app-css/index.css';
import {useMachine} from '@xstate/react';
import {useHashChange} from './useHashChange';
import {Todo} from './Todo';
import * as fromTodosAction from './xstate/todos/actions';
import * as fromTodosMachine from './xstate/todos/machine';

//@ts-ignore
function filterTodos(state, todos) {
  if (state.matches('active')) {
    return todos.filter(todo => !todo.completed);
  }

  if (state.matches('completed')) {
    return todos.filter(todo => todo.completed);
  }

  return todos;
}
const persistedTodosMachine = fromTodosMachine.todosStateMachine.withConfig(
  {
    actions: {
      persist: ctx => {
        localStorage.setItem('todos-xstate', JSON.stringify(ctx.todos));
      },
    },
  },
  // initial state from localstorage
  {
    todo: 'Learn state machine',
    todos: (() => {
      try {
        return JSON.parse(localStorage.getItem('todos-xstate') as string) || [];
      } catch (e) {
        return [];
      }
    })(),
  },
);

export function Todos() {
  const [state, send] = useMachine(persistedTodosMachine);

  useHashChange(() => {
    send(`SHOW_${window.location.hash.slice(2).toUpperCase() || 'ALL'}`);
  });
  //@ts-ignore
  const {todos, todo} = state.context;

  console.log(state);
  const numActiveTodos = todos.filter((todo: any) => !todo.completed).length;
  const allCompleted = todos.length > 0 && numActiveTodos === 0;
  const mark = !allCompleted ? 'COMPLETE' : 'ACTIVE';
  const markEvent = `MARK_${mark}`;
  const filteredTodos = filterTodos(state, todos);

  return (
    <section className="todoapp" data-state={state.toStrings()}>
      <header className="header">
        <h1>todos</h1>
        <input
          className="new-todo"
          placeholder="What needs to be done?"
          autoFocus
          onKeyPress={(e: any) => {
            if (e.key === 'Enter') {
              send(fromTodosAction.NEWTODO_COMMIT, {value: e.target.value});
            }
          }}
          onChange={e => {
            console.log(e);
            send(fromTodosAction.NEWTODO_CHANGED, {value: e.target.value});
          }}
          value={todo}
        />
      </header>
      <section className="main">
        <input
          id="toggle-all"
          className="toggle-all"
          type="checkbox"
          checked={allCompleted}
          onChange={() => {
            send(markEvent);
          }}
        />
        <label htmlFor="toggle-all" title={`Mark all as ${mark}`}>
          Mark all as {mark}
        </label>
        <ul className="todo-list">
          {filteredTodos.map(todo => <Todo key={todo.id} todoRef={todo.ref} />)}
        </ul>
      </section>
      {!!todos.length && (
        <footer className="footer">
          <span className="todo-count">
            <strong>{numActiveTodos}</strong> item
            {numActiveTodos === 1 ? '' : 's'} left
          </span>
          <ul className="filters">
            <li>
              <a
                className={cn({
                  selected: state.matches(fromTodosAction.SHOW_ALL),
                })}
                href="#/">
                All
              </a>
            </li>
            <li>
              <a
                className={cn({
                  selected: state.matches(fromTodosAction.SHOW_ACTIVE),
                })}
                href="#/active">
                Active
              </a>
            </li>
            <li>
              <a
                className={cn({
                  selected: state.matches(fromTodosAction.SHOW_COMPLETED),
                })}
                href="#/completed">
                Completed
              </a>
            </li>
          </ul>
          {numActiveTodos < todos.length && (
            <button
              onClick={_ => send(fromTodosAction.CLEAR_COMPLETED)}
              className="clear-completed">
              Clear completed
            </button>
          )}
        </footer>
      )}
    </section>
  );
}
