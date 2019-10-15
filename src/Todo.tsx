import React, {useEffect, useRef} from 'react';
import {useService} from '@xstate/react';
import cn from 'classnames';
import * as fromTodoState from './xstate/todo/state';
import * as fromTodoAction from './xstate/todo/actions';

//@ts-ignore
export function Todo({todoRef}) {
  const [state, send] = useService(todoRef);
  const inputRef = useRef(null);
  //@ts-ignore
  const {id, title, completed} = state.context;

  useEffect(
    () => {
      todoRef.execute(state, {
        focusInput() {
          //@ts-ignore
          inputRef.current && inputRef.current.select();
        },
      });
    },
    [state, todoRef],
  );

  return (
    <li
      className={cn({
        editing: state.matches(fromTodoState.editing_state),
        completed,
      })}
      data-todo-state={completed ? 'completed' : 'active'}
      key={id}>
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          onChange={_ => {
            send(fromTodoAction.TOGGLE_COMPLETE_ACTION);
          }}
          value={completed}
          checked={completed}
        />
        <label
          onDoubleClick={e => {
            send(fromTodoAction.EDIT_ACTION);
          }}>
          {title}
        </label>{' '}
        <button
          className="destroy"
          onClick={() => send(fromTodoAction.DELETE_ACTION)}
        />
      </div>
      <input
        className="edit"
        value={title}
        onBlur={_ => send(fromTodoAction.EDITING_ACTION_BLUR)}
        onChange={e =>
          send(fromTodoAction.EDITING_ACTION_CHANGE, {value: e.target.value})
        }
        onKeyPress={e => {
          if (e.key === 'Enter') {
            send(fromTodoAction.EDITING_ACTION_COMMIT);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            send(fromTodoAction.EDITING_ACTION_CANCEL);
          }
        }}
        ref={inputRef}
      />
    </li>
  );
}
