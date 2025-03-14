import { createReducer, on } from '@ngrx/store';
import * as BookActions from './book.actions';
import { loadBooks, loadBooksFailure, loadBooksSuccess } from './book.actions';
import { BookDoc } from '../models/book.model';

export interface BookState {
  books: BookDoc[];
  loading: boolean;
  error: string | null;
}

const initialState: BookState = {
  books: [],
  loading: false,
  error: null,
};

export interface AppState {
  books: BookDoc[];
}

// export const bookReducer = createReducer(
//   initialState,
//   on(BookActions.loadBooksSuccess, (state, { books }) => ({ ...state, books })),
//   on(BookActions.loadBooksFailure, (state, { error }) => ({ ...state, error }))
// );
export const bookReducer = createReducer(
  initialState,
  on(loadBooks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loadBooksSuccess, (state, { books }) => ({
    ...state,
    books: books,
    loading: false,
    error: null
  })),
  on(loadBooksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(BookActions.setBooksFromLocalStorage, (state, { books }) => ({
    ...state,
    books,
    loading: false,
    error: null
  }))
);