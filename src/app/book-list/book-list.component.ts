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
import {
  loadBooks,
  loadBooksSuccess,
  setBooksFromLocalStorage,
} from '../state/book.actions';
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
import { BookItemComponent } from '../book-item/book-item.component';
import { BookFormComponent } from '../book-form/book-form.component';

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
    ConfirmDialog,
    Tag,
    BookItemComponent,
    BookFormComponent,
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
  selectedBook: any = null;
  isEditMode: boolean = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cd = inject(ChangeDetectorRef);

  displayDialog: boolean = false; // For Add Book dialog
  editDialog: boolean = false;

  constructor(private store: Store<{ books: BookState }>) {
    this.books$ = this.store.pipe(
      select((state) => state.books.books),
      map((books) => books ?? [])
    );
    const data = this.books$;
    console.log(this.books$);
  }

  ngOnInit(): void {
    this.category = this.route.snapshot.paramMap.get('category')!;
    console.log('Category:', this.category);
    this.localBooks();
    this.calculateBorrowedTrends();

    // this.store.dispatch(loadBooks({ category: this.category }));

    this.cols = [
      { field: 'author_key', header: 'Author Key' },
      { field: 'title', header: 'Title' },
      { field: 'author_name', header: 'Author Name' },
      { field: 'first_publish_year', header: 'Year' },
      // { field: 'inventoryStatus', header: 'Status' },
    ];

    this.statuses = [
      { label: 'AVAILABLE', value: 'available' },
      { label: 'CHECKED OUT', value: 'Checked Out' },
    ];
  }

  localBooks(): void {
    const storedBooks = localStorage.getItem(`books_${this.category}`);
    if (storedBooks) {
      this.books = JSON.parse(storedBooks);
      this.books = this.books.map((book) => {
        if (!book.inventoryStatus) {
          book.inventoryStatus = 'available'; // or 'InStock', etc.
        }
        return book;
      });
      console.log('Books from local storage:', this.books);
      // console.log("hihi",this.books$);
      // console.log(this.books);
      this.store.dispatch(setBooksFromLocalStorage({ books: this.books }));
      this.cd.detectChanges();
      this.updateTable();
    } else {
      this.store.dispatch(loadBooks({ category: this.category }));
      // localStorage.setItem('books', JSON.stringify(this.books$));
      this.books$.subscribe((books) => {
        books = books.map((book) => {
          if (!book.inventoryStatus) {
            book.inventoryStatus = 'available';
          }
          return book;
        });

        this.books = books;
        console.log('Books from store:', books);
        localStorage.setItem(`books_${this.category}`, JSON.stringify(books));
        this.cd.detectChanges();
        this.updateTable();
      });
    }
  }
  deleteSelectedBooks() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected books?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const selectedIds = this.selectedBooks.map((book) => book.author_key);
        this.books = this.books.filter(
          (book) => !selectedIds.includes(book.author_key)
        );
        localStorage.setItem(
          `books_${this.category}`,
          JSON.stringify(this.books)
        );
        this.selectedBooks = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Books Deleted',
          life: 3000,
        });
        this.updateTable();
      },
    });
  }

  deleteBook(book: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${book.title}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.books = this.books.filter((b) => b.author_key !== book.author_key);
        localStorage.setItem(
          `books_${this.category}`,
          JSON.stringify(this.books)
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Book Deleted',
          life: 3000,
        });
        this.updateTable();
      },
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'available':
        return 'success';
      case 'Checked Out':
        return 'danger';
      default:
        // case 'OUTOFSTOCK':
        return 'info';
    }
  }
  onFilterGlobal(event: any) {
    if (this.dt) {
      this.dt.filterGlobal(event.target.value, 'contains');
    }
  }

  updateBookStatus(book: any, newStatus: string) {
    book.inventoryStatus = newStatus;

    // Then persist the updated array in localStorage
    localStorage.setItem(`books_${this.category}`, JSON.stringify(this.books));
    this.updateTable();
  }

  bookDetail(book: any) {
    this.selectedBook = book;
    console.log(this.selectedBook);
  }

  closeBookDetail() {
    this.selectedBook = null;
  }

  openNew() {
    this.selectedBook = null; // Reset form for new book
    this.isEditMode = false;
    this.displayDialog = true;
    this.editDialog = false;
    this.router.navigate(['/add-book'], {
      state: { action: 'new', category: this.category },
    });
  }
  editBook(book: any) {
    // this.selectedBook = { ...book }; // Clone the book object
    this.isEditMode = true;
    this.selectedBook = book;
    // this.bookForm.patchValue(book); // Prepopulate the form with the book's data
    this.editDialog = true;
    this.displayDialog = false;
    const authorKey = Array.isArray(book.author_key)
      ? book.author_key[0]
      : book.author_key;
    this.router.navigate(['/edit-book', authorKey], {
      state: { action: 'edit', book, category: this.category },
    });
  }

  saveBook(book: any) {
    if (this.isEditMode) {
      const index = this.books.findIndex(
        (b) => b.author_key === book.author_key
      );
      if (index !== -1) {
        this.books[index] = book;
      }
    } else {
      this.books.push(book);
    }
    localStorage.setItem(`books_${this.category}`, JSON.stringify(this.books));
    this.cd.detectChanges();
    this.updateTable();
  }

  updateTable() {
    // Create a shallow copy of the books array to trigger change detection
    this.books = [...this.books];
    this.cd.detectChanges();
  }

  onChange() {
    this.router.navigate(['categories']);
  }

  borrowedBooksByCategory: { [key: string]: number } = {};

  calculateBorrowedTrends() {
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');

    this.borrowedBooksByCategory = categories.reduce(
      (acc: any, category: string) => {
        const books = JSON.parse(
          localStorage.getItem(`books_${category}`) || '[]'
        );
        const borrowedCount = books.filter(
          (b: any) => b.inventoryStatus === 'Checked Out'
        ).length;
        acc[category] = borrowedCount;
        return acc;
      },
      {}
    );

    localStorage.setItem(
      'borrowed_trends',
      JSON.stringify(this.borrowedBooksByCategory)
    );
  }
}
