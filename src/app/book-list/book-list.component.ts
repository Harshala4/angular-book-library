import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { BookService } from '../services/book.service';
import { Store, select } from '@ngrx/store';
import { loadBooks, loadBooksSuccess, setBooksFromLocalStorage } from '../state/book.actions';
import { map, Observable, of, take } from 'rxjs';
import { BookState } from '../state/book.reducer';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Ripple } from 'primeng/ripple';

interface Column {
  field: string;
  header: string;
}

@Component({
  standalone: true,
  selector: 'app-book-list',
  imports: [
    FormsModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CommonModule,
    ButtonModule,
    ToolbarModule,
    InputTextModule,
    ToastModule,
    Tag,
    ConfirmDialog,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  cols!: Column[];
  selectedBooks: any[] = [];
  books: any[] = [];
  category: string = '';
  statuses!: any[];
  books$: Observable<any[]> = of([]);
  loading$!: Observable<boolean>;
  error$!: Observable<any>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cd = inject(ChangeDetectorRef);
  

  constructor(private store: Store<{ books: BookState }>) {
    this.books$ = this.store.pipe(
      select((state) => state.books.books),
      map((books) => books ?? [])
    );
    const data=this.books$;
    console.log(this.books$);
  }

  ngOnInit(): void {
    this.category = this.route.snapshot.paramMap.get('category')!;
    this.localBooks();

    // this.store.dispatch(loadBooks({ category: this.category }));

    this.cols = [
      {field:'author_key', header:'Author Key'},
      { field: 'title', header: 'Title' },
      { field: 'author_name', header: 'Author Name' },
      { field: 'first_publish_year', header: 'Year' },
      // { field: 'inventoryStatus', header: 'Status' },
    ];

    this.statuses = [
      { label: 'INSTOCK', value: 'instock' },
      { label: 'LOWSTOCK', value: 'lowstock' },
      { label: 'OUTOFSTOCK', value: 'outofstock' }
  ];
  }

  localBooks():void {
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) {
      this.books = JSON.parse(storedBooks);
      console.log("Books from local storage:", this.books);
      // console.log("hihi",this.books$);
      // console.log(this.books);
      this.store.dispatch(setBooksFromLocalStorage({ books: this.books }));
      this.cd.detectChanges();
    } else {
      this.store.dispatch(loadBooks({ category: this.category }));
      // localStorage.setItem('books', JSON.stringify(this.books$));
      this.books$.subscribe((books) => {
        this.books = books;
        console.log('Books from store:',books);
        localStorage.setItem('books', JSON.stringify(books));
        this.cd.detectChanges();
      });
    }
  }
  deleteSelectedBooks() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected books?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const selectedIds = this.selectedBooks.map((book) => book.id);
        this.books = this.books.filter(
          (book) => !selectedIds.includes(book.id)
        );
        localStorage.setItem('books', JSON.stringify(this.books));
        this.selectedBooks = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Books Deleted',
          life: 3000,
        });
      },
    });
  }

  openNew() {
    this.router.navigate(['/add-book'], { state: { action: 'new' } });
  }
  editBook(book: any) {
    this.router.navigate(['/edit-book'], { state: { action: 'edit', book } });
  }

  deleteBook(book: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${book.name}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.books = this.books.filter((b) => b.id !== book.id);
        localStorage.setItem('books', JSON.stringify(this.books));
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Book Deleted',
          life: 3000,
        });
      },
    });
  }
  getSeverity(status: string) {
    switch (status) {
      case 'INSTOCK':
        return 'success';
      case 'LOWSTOCK':
        return 'warn';
      default:
      // case 'OUTOFSTOCK':
        return 'danger';
    }
  }
  onFilterGlobal(event:any){
    if(this.dt){
      this.dt.filterGlobal(event.target.value,'contains');
    }
  }
}
