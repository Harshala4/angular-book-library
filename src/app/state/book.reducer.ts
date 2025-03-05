import { createReducer, on } from '@ngrx/store';
import * as BookActions from './book.actions';

export interface BookState {
  books: any[];
  error: string | null;
}

const initialState: BookState = {
  books: [],
  error: null
};

export const bookReducer = createReducer(
  initialState,
  on(BookActions.loadBooksSuccess, (state, { books }) => ({ ...state, books })),
  on(BookActions.loadBooksFailure, (state, { error }) => ({ ...state, error }))
);
