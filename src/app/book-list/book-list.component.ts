import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { BookService } from '../services/book.service';
import { Store, select } from '@ngrx/store';
import { loadBooks } from '../state/book.actions';
import { map, Observable, of } from 'rxjs';
import { BookState } from '../state/book.reducer';

@Component({
  standalone: true,
  selector: 'app-book-list',
  imports: [TableModule, CommonModule],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit{
  books$: Observable<any[]>=of([]);
  constructor(private store: Store<{ books: BookState }>) {
    this.books$ = this.store.pipe(
      select((state) => state.books.books),
      map((books) => books ?? [])
    );
    console.log(this.books$);
  }
  ngOnInit(): void {
    this.store.dispatch(loadBooks({ category: 'science' }));    
  }
  // ngOnInit(): void {
  //   this.route.queryParams.subscribe(params => {
  //     const category:string= params['category'];
  //     const search:string | undefined = params['search'];
  //   this.store.dispatch(loadBooks({ category,search }));
  // });}
  // selectedBook=this.books$[0]
  // searchBooks() {}
}
