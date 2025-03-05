import { Injectable,inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BookService } from '../services/book.service';
import * as BookActions from './book.actions';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class BookEffects {

   private actions$=inject(Actions);
   private bookService=inject(BookService); 

  loadBooks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookActions.loadBooks),
      mergeMap(action =>
        this.bookService.getBooksByCategory(action.category).pipe(
          map(books => BookActions.loadBooksSuccess({ books })),
          catchError(error => of(BookActions.loadBooksFailure({ error: error.message })))
        )
      )
    )
  );

// constructor(private actions$: Actions, private bookService: BookService) {}
}
