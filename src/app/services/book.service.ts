import { inject, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CategoryResponse } from '../models/book.model';

interface OpenLibraryResponse {
  docs: any[]; // ✅ Defines that 'docs' is an array of books
}

@Injectable({
  providedIn: 'root',
})

export class BookService {

  private categoriesUrl = 'https://openlibrary.org/subjects.json';
  private booksUrl = 'https://openlibrary.org/search.json?q=';

  constructor(private http: HttpClient) {}
  getBookCategories(): Observable<CategoryResponse> {
    console.log(this.http.get<CategoryResponse>(this.categoriesUrl));
    return this.http.get<CategoryResponse>(this.categoriesUrl)
  }

  getBooksByCategory(category?: string): Observable<any> {
    // let query = search ? search : category ? category : 'javascript';
    
    return this.http.get<any>(`${this.booksUrl}${category}&page=1`).
    pipe(
      map(response => response.docs || [])
    );
  }
}
