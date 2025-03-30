import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { BookService } from '../services/book.service';
import { Store, select } from '@ngrx/store';
import {
  addBook,
  editBook,
  loadBooks,
  setBooksFromLocalStorage,
} from '../state/book.actions';
import { filter, map, Observable, of, take } from 'rxjs';
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
import { BookFormComponent } from '../book-form/book-form.component';
import { BookDoc } from '../models/book.model';
import { CategorySelectorComponent } from '../category-selector/category-selector.component';
import { CatChartComponent } from '../category-selector/cat-chart/cat-chart.component';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { distinctUntilChanged } from 'rxjs/operators';

interface Column {
  field: string;
  header: string;
}

interface Status {
  label: string;
  value: string;
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
    BookFormComponent,
    CategorySelectorComponent,
    CatChartComponent,
    HeaderComponent,
    ProgressSpinnerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit {
  loading: boolean = false;
  @ViewChild('dt') dt!: Table;
  cols!: Column[];
  selectedBooks: BookDoc[] = [];
  books: BookDoc[] = [];
  tableBooks: BookDoc[] = [];
  category: string = '';
  statuses: Status[] = [];
  books$: Observable<BookDoc[]> = of([]);
  loading$!: Observable<boolean>;
  error$!: unknown;
  selectedBook: BookDoc | null = null;
  isEditMode: boolean = false;
  totalBooks: number = 0;
  @Output() totalBooksChange = new EventEmitter<number>();

  private bookService = inject(BookService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cd = inject(ChangeDetectorRef);

  displayDialog: boolean = false; // For Add Book dialog
  editDialog: boolean = false;

  constructor(
    private store: Store<{ books: BookState }>,
    private http: HttpClient
  ) {
    this.books$ = this.store.pipe(
      select((state) => state.books.books),
      map((books) => books ?? [])
    );
    console.log(this.books$);
  }

  ngOnInit(): void {
    console.log('Category:', this.category);
    // this.loadBooksFromLocalStorage();
    // this.loadCategoriesAndCalculateBorrowedTrends();
    // this.store.dispatch(loadBooks({ category: this.category }));
    if (this.category && this.category.trim() !== '') {
      this.loadBooksFromLocalStorage();
      this.loadCategoriesAndCalculateBorrowedTrends();
    } else {
      console.warn('Category is not set. Skipping initial book loading.');
    }

    this.cols = [
      { field: 'author_key', header: 'Author Key' },
      { field: 'title', header: 'Title' },
      { field: 'author_name', header: 'Author Name' },
      { field: 'first_publish_year', header: 'Year' },
    ];

    this.statuses = [
      { label: 'Available', value: 'Available' },
      { label: 'Checked Oot', value: 'Checked Out' },
    ];

    this.books$.subscribe((books) => {
      this.totalBooks = books.length;
      this.totalBooksChange.emit(this.totalBooks);
    });
  }

  /**
   * 1. Method to read books from local storage.
   * 2. Udpate the available status for each of the books.
   */

  loadBooksFromLocalStorage(): void {
    if (!this.category || this.category.trim() === '') {
      console.warn('Category is not set. Skipping local storage operations.');
      return; // Exit the method if the category is invalid
    }

    console.log('Loading started...');
    this.loading = true;

    const storageKey = `books_${this.category}`;
    let storedBooks: BookDoc[] = [];

    try {
      const rawData = localStorage.getItem(storageKey);
      storedBooks = rawData ? JSON.parse(rawData) : [];

      if (!Array.isArray(storedBooks)) {
        console.error(
          `Invalid data in localStorage for ${storageKey}:`,
          rawData
        );
        storedBooks = [];
      }
    } catch (error) {
      console.error(`Error parsing localStorage for ${storageKey}:`, error);
      storedBooks = [];
    }

    if (storedBooks.length > 0) {
      this.books = storedBooks.map((book) => ({
        ...book,
        inventoryStatus: book.inventoryStatus || 'Available',
      }));

      this.tableBooks = [...this.books];

      console.log(`Books from local storage (${storageKey}):`, this.books);

      // Store books in NgRx Store
      this.store.dispatch(setBooksFromLocalStorage({ books: this.books }));

      this.cd.detectChanges(); // Ensure UI updates
      this.updateTable();
      this.calculateBorrowedAndAvailableTrends([this.category]);
      this.loading = false;
      console.log('Loading finished.');
    } else {
      // If no books in local storage, fetch from store
      this.books = [];
      this.tableBooks = [];
      this.store.dispatch(loadBooks({ category: this.category }));

      this.books$
        .pipe(
          take(2), // Ensure single execution
          filter(() => !!this.category), // Ensure category is valid
          distinctUntilChanged() // Prevent duplicate emissions
        )
        .subscribe({
          next: (books) => {
            const scopedBooks = books.map((book) => ({
              ...book,
              inventoryStatus: book.inventoryStatus || 'Available',
            }));

            this.books = scopedBooks;
            this.tableBooks = [...this.books];
            console.log(`Books from store (${storageKey}):`, scopedBooks);
            localStorage.setItem(storageKey, JSON.stringify(scopedBooks));

            this.cd.detectChanges();
            this.updateTable();
            this.calculateBorrowedAndAvailableTrends([this.category]);
            this.loading = false;
            console.log('Loading finished.');
          },
          error: (err) => {
            console.error(`Error loading books from store:`, err);
            this.loading = false; // Stop loading on error
          },
        });
    }
  }

  onCategoryChange(category: string) {
    if (!category || category.trim() === '') {
      console.warn('Invalid category selected. Skipping book loading.');
      return;
    }

    this.loading = true;
    this.books = [];
    this.tableBooks = [];
    this.category = category;

    this.cd.detectChanges();

    this.loadBooksFromLocalStorage();
    this.calculateBorrowedAndAvailableTrends([this.category]);
  }

  deleteSelectedBooks() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete selected books?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
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
        
        this.tableBooks = [...this.books];

        this.updateTable();
        this.calculateBorrowedAndAvailableTrends([this.category]);

        this.bookService.updateTotalBooks(this.books.length);
        setTimeout(() => {
          // ✅ Ensures the latest value is captured
          this.bookService.totalBooks$.subscribe((count) =>
            console.log('After delete:', count)
          );
        });
      },
    });
  }

  deleteBook(book: BookDoc) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${book.title}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
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
        this.tableBooks = [...this.books];
        this.updateTable();
        this.calculateBorrowedAndAvailableTrends([this.category]);

        this.bookService.updateTotalBooks(this.books.length);
        setTimeout(() => {
          // ✅ Ensures the latest value is captured
          this.bookService.totalBooks$.subscribe((count) =>
            console.log('After delete:', count)
          );
        });
      },
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Checked Out':
        return 'danger';
      default:
        return 'info';
    }
  }
  onFilterGlobal(event: Event) {
    if (this.dt) {
      const inputElement = event.target as HTMLInputElement;
      this.dt.filterGlobal(inputElement.value, 'contains');
    }
  }

  updateBookStatus(book: BookDoc, newStatus: string) {
    book.inventoryStatus = newStatus;

    // Then persist the updated array in localStorage
    localStorage.setItem(`books_${this.category}`, JSON.stringify(this.books));
    this.updateTable();
    this.calculateBorrowedAndAvailableTrends([this.category]);
  }

  toggleBookStatus(book: BookDoc) {
    const updatedBook = {
      ...book,
      inventoryStatus:
        book.inventoryStatus === 'Available' ? 'Checked Out' : 'Available',
    };

    const index = this.books.findIndex((b) => b.author_key === book.author_key);
    if (index !== -1) {
      // this.books[index] = updatedBook;
      this.books = [
        ...this.books.slice(0, index),
        updatedBook,
        ...this.books.slice(index + 1),
      ];
      this.tableBooks = [...this.books];
    }

    localStorage.setItem(`books_${this.category}`, JSON.stringify(this.books));
    this.updateTable();
    this.calculateBorrowedAndAvailableTrends([this.category]);
  }

  openNew() {
    this.selectedBook = null; // Reset form for new book
    this.isEditMode = false;
    this.displayDialog = true;
    this.editDialog = false;
    console.log('ADD');
  }
  editBook(book: BookDoc) {
    this.isEditMode = true;
    this.selectedBook = { ...book };
    this.editDialog = true;
    this.displayDialog = false;
  }

  onCancelDialog() {
    this.displayDialog = false;
    this.editDialog = false;
  }

  saveBook(book: BookDoc) {
    const authorKey = Array.isArray(book.author_key)
      ? book.author_key[0]
      : book.author_key;

    const index = this.books.findIndex((b) => {
      const bKey = Array.isArray(b.author_key) ? b.author_key[0] : b.author_key;
      return bKey === authorKey;
    });

    if (this.isEditMode && index !== -1) {
      // this.books[index] = book;
      this.books = [
        ...this.books.slice(0, index),
        { ...book },
        ...this.books.slice(index + 1),
      ];
      this.store.dispatch(editBook({ book }));
      this.messageService.add({
        severity: 'success',
        summary: 'Successful',
        detail: 'Book Updated',
        life: 3000,
      });
    } else {
      // this.books.push(book);
      this.books = [...this.books, { ...book }];
      this.store.dispatch(addBook({ book }));
      this.messageService.add({
        severity: 'success',
        summary: 'Successful',
        detail: 'Book Added',
        life: 3000,
      });
    }
    this.tableBooks = [...this.books];

    localStorage.setItem(`books_${this.category}`, JSON.stringify(this.books));
    this.cd.detectChanges();
    this.updateTable();
    this.calculateBorrowedAndAvailableTrends([this.category]);

    this.displayDialog = false;
    this.editDialog = false;
    console.log(this.books.length);
    this.bookService.updateTotalBooks(this.books.length);
  }

  updateTable() {
    // Create a shallow copy of the books array to trigger change detection
    this.books = [...this.books];
    this.cd.detectChanges();
  }

  borrowedBooksByCategory: { [key: string]: number } = {};

  loadCategoriesAndCalculateBorrowedTrends() {
    this.http.get<{ categories: string[] }>('assets/categories.json').subscribe(
      (data) => {
        const categories = data.categories;
        this.calculateBorrowedAndAvailableTrends(categories);
      },
      (error) => {
        console.error('Error loading categories:', error);
      }
    );
  }

  calculateBorrowedAndAvailableTrends(categories: string[]) {
    const borrowedTrends: { [key: string]: number } = JSON.parse(
      localStorage.getItem('borrowed_trends') || '{}'
    );
    const availableTrends: { [key: string]: number } = JSON.parse(
      localStorage.getItem('available_trends') || '{}'
    );

    categories.forEach((category: string) => {
      const storageKey = `books_${category}`;
      const books = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const borrowedCount = books.filter(
        (b: BookDoc) => b.inventoryStatus === 'Checked Out'
      ).length;
      const availableCount = books.length - borrowedCount;

      borrowedTrends[category] = borrowedCount;
      availableTrends[category] = availableCount;
    });

    this.borrowedBooksByCategory = borrowedTrends;

    // Store the data separately in localStorage
    localStorage.setItem('borrowed_trends', JSON.stringify(borrowedTrends));
    localStorage.setItem('available_trends', JSON.stringify(availableTrends));
  }
}
