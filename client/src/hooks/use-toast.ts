import { useState, useEffect } from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: string;
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId
              ? {
                  ...t,
                  open: false,
                }
              : t,
          ),
        };
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => ({
          ...t,
          open: false,
        })),
      };
    }

    case actionTypes.REMOVE_TOAST: {
      const { toastId } = action;

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        };
      }

      return {
        ...state,
        toasts: [],
      };
    }
  }
};

export function useToast() {
  const [state, setState] = useState<State>({ toasts: [] });

  const dispatch = (action: Action) => {
    setState((prevState) => reducer(prevState, action));
  };

  const toast = (props: Omit<ToasterToast, 'id' | 'open'>) => {
    const id = generateId();
    const newToast = {
      ...props,
      id,
      open: true,
    };

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: newToast,
    });

    return id;
  };

  const update = (props: ToasterToast) => {
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: props,
    });
  };

  const dismiss = (toastId?: string) => {
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId,
    });
  };

  const remove = (toastId?: string) => {
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  };

  useEffect(() => {
    state.toasts.forEach((toast) => {
      if (!toast.open || toastTimeouts.has(toast.id)) return;

      const timeout = setTimeout(() => {
        dispatch({
          type: actionTypes.DISMISS_TOAST,
          toastId: toast.id,
        });

        setTimeout(() => {
          dispatch({
            type: actionTypes.REMOVE_TOAST,
            toastId: toast.id,
          });
        }, 300);
      }, TOAST_REMOVE_DELAY);

      toastTimeouts.set(toast.id, timeout);
    });

    return () => {
      state.toasts.forEach((toast) => {
        const timeout = toastTimeouts.get(toast.id);
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [state.toasts]);

  return {
    toasts: state.toasts,
    toast,
    update,
    dismiss,
    remove,
  };
}
