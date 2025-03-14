import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  BookApiResponse,
  BookDoc,
} from '../models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private booksUrl = 'https://openlibrary.org/search.json?q=';

  constructor(private http: HttpClient) {}

  getBooksByCategory(category: string = 'javascript'): Observable<BookDoc[]> {

    return this.http
      .get<BookApiResponse>(`${this.booksUrl}${category}&page=1`)
      .pipe(map((response) => response.docs || []));
  }
}
