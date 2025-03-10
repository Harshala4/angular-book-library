import { Injectable,inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BookService } from '../services/book.service';
import * as BookActions from './book.actions';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of,switchMap } from 'rxjs';
import { loadBooks, loadBooksSuccess, loadBooksFailure } from './book.actions';
import { BookDoc } from '../models/book.model';

@Injectable()
export class BookEffects {

   private actions$=inject(Actions);
   private bookService=inject(BookService); 

  // loadBooks$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(BookActions.loadBooks),
  //     mergeMap(action =>
  //       this.bookService.getBooksByCategory(action.category).pipe(
  //         map(books => BookActions.loadBooksSuccess({ books })),
  //         catchError(error => of(BookActions.loadBooksFailure({ error: error.message })))
  //       )
  //     )
  //   )
  // );
  loadBooks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadBooks),
      switchMap((action) => {
        // Check local storage first
        const storedBooks = localStorage.getItem('books');
        if (storedBooks) {
          const books = JSON.parse(storedBooks);
          const updatedBooks = books.map((book: any) => ({
            ...book,
            inventoryStatus: book.inventoryStatus || 'available',
          }));
          // You might filter by category if needed, or just return all
          return of(loadBooksSuccess({ books:updatedBooks }));
        } else {
          // Fetch from API if local storage is empty
          return this.bookService.getBooksByCategory(action.category).pipe(
            map((response) => {
              const docs: BookDoc[] = response.map((doc: any) => ({
                author_key: doc.author_key,
                author_name: doc.author_name,
                first_publish_year: doc.first_publish_year,
                title: doc.title,
                inventoryStatus:'available',
                subtitle:doc.subtitle
              }));
              localStorage.setItem('books', JSON.stringify(docs));
              return loadBooksSuccess({ books: docs });
            }),
            catchError((error) => of(loadBooksFailure({ error })))
          );
        }
      })
    )
  );

}
