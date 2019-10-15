import {assign, Machine, sendParent} from 'xstate';
import {Todo} from '../../models/Todo';
import * as fromState from './state';
import * as fromActions from './actions';
export const TODO_ID = 'TODO_ID';

const initialContext = {
  id: null,
  title: '',
  prevTitle: '',
};

const setCompleteAction = (completed: boolean) => assign<Todo>({completed});
const sendTodoCommitAction = sendParent(
  (ctx: Todo) => <any>{type: 'TODO_COMMIT', todo: ctx},
);
const setPrevTitle = assign<Todo>({prevTitle: ctx => ctx.title});

const isCompletedGuard = (ctx: Todo) => !!ctx.completed;
const hasTitleGuard = (ctx: Todo) => ctx.title.trim().length > 0;

export const todoMachine = Machine<Todo>({
  id: TODO_ID,
  initial: fromState.reading_state,
  context: initialContext,
  on: {
    [fromActions.DELETE_ACTION]: fromState.deleting_state,
    [fromActions.TOGGLE_COMPLETE_ACTION]: {
      target: `.${fromState.reading_state}.${
        fromState.reading_state_completed
      }`,
      actions: [setCompleteAction(true), sendTodoCommitAction],
    },
  },
  states: {
    [fromState.reading_state]: {
      initial: fromState.reading_state_unknown,
      states: {
        [fromState.reading_state_unknown]: {
          on: {
            '': {
              cond: isCompletedGuard,
              target: fromState.reading_state_completed,
            },
          },
        },
        [fromState.reading_state_pending]: {
          on: {
            [fromActions.SET_COMPLETE_ACTION]: {
              target: fromState.reading_state_completed,
              actions: [setCompleteAction(true), sendTodoCommitAction],
            },
          },
        },
        [fromState.reading_state_completed]: {
          on: {
            [fromActions.TOGGLE_COMPLETE_ACTION]: {
              target: fromState.reading_state_pending,
              actions: [setCompleteAction(false), sendTodoCommitAction],
            },
            [fromActions.SET_ACTIVE_ACTION]: {
              target: fromState.reading_state_pending,
              actions: [setCompleteAction(false), sendTodoCommitAction],
            },
          },
        },
        [fromState.reading_state_hist]: {
          type: 'history',
        },
      },
    },
    [fromState.editing_state]: {
      onEntry: setPrevTitle,
      on: {
        [fromActions.EDITING_ACTION_CHANGE]: {
          actions: assign<Todo>({title: (_, e) => e.value}),
        },
        [fromActions.EDITING_ACTION_COMMIT]: [
          {
            target: `${fromState.reading_state}.${
              fromState.reading_state_hist
            }`,
            cond: hasTitleGuard,
          },
          {
            target: fromState.deleting_state,
          },
        ],
        [fromActions.EDITING_ACTION_BLUR]: {
          target: fromState.reading_state,
        },
        [fromActions.EDITING_ACTION_CANCEL]: {
          target: fromState.reading_state,
          actions: assign<Todo>({title: ctx => ctx.prevTitle || ''}),
        },
      },
    },
    [fromState.deleting_state]: {
      onEntry: sendParent(ctx => <any>{type: 'TODO_DELETE', id: ctx.id}),
    },
  },
});
