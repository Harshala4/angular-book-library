import { inject, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BookApiResponse, BookDoc, CategoryResponse } from '../models/book.model';

// interface OpenLibraryResponse {
//   docs: BookDoc[]; // ✅ Defines that 'docs' is an array of books
// }

@Injectable({
  providedIn: 'root',
})

export class BookService {

  
  private booksUrl = 'https://openlibrary.org/search.json?q=';

  constructor(private http: HttpClient) {}
  

  getBooksByCategory(category?: string): Observable<any[]> {
    // let query = search ? search : category ? category : 'javascript';
    
    return this.http.get<BookApiResponse>(`${this.booksUrl}${category}&page=1`).
    pipe(
      map(response => response.docs)
    );
  }
}
