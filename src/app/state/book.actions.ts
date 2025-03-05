import { createAction, props } from '@ngrx/store';

export const loadBooks = createAction(
  '[Book] Load Books',
  props<{ category: string }>()
);
export const loadBooksSuccess = createAction(
  '[Book] Load Books Success',
  props<{ books: any[] }>()
);
export const loadBooksFailure = createAction(
  '[Book] Load Books Failure',
  props<{ error: string }>()
);
