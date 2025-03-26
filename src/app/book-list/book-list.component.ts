import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
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
import { HeaderComponent } from "../header/header.component";

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
    HeaderComponent
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  cols!: Column[];
  selectedBooks: BookDoc[] = [];
  books: BookDoc[] = [];
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
    // this.category = this.route.snapshot.paramMap.get('category')!;
    console.log('Category:', this.category);
    this.loadBooksFromLocalStorage();
    this.loadCategoriesAndCalculateBorrowedTrends();

    // this.store.dispatch(loadBooks({ category: this.category }));

    this.cols = [
      { field: 'author_key', header: 'Author Key' },
      { field: 'title', header: 'Title' },
      { field: 'author_name', header: 'Author Name' },
      { field: 'first_publish_year', header: 'Year' },
    ];

    this.statuses = [
      { label: 'AVAILABLE', value: 'available' },
      { label: 'CHECKED OUT', value: 'Checked Out' },
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
    // const storageKey = `books_${this.category}`;
    const storedBooks = JSON.parse(
      localStorage.getItem(`books_${this.category}`) || 'null'
    );
    if (storedBooks) {
      // this.books = JSON.parse(storedBooks || 'null');
      this.books = storedBooks.map((book: BookDoc) => {
        if (!book.inventoryStatus) {
          book.inventoryStatus = 'available'; // or 'InStock', etc.
        }
        return book;
      });
      console.log(
        'Books from local storage:',
        `books_${this.category}`,
        this.books
      );
      // refactor the method name to store data in NgRx Store. storeBooks:
      this.store.dispatch(setBooksFromLocalStorage({ books: this.books }));

      /** Explain the reasoning behind this. */
      this.cd.detectChanges(); // Trigger change detection
      this.updateTable(); //Update the table and create a copy of the books array
      this.calculateBorrowedAndAvailableTrends([this.category]);
    } else {
      /** Maintain a sequence of events. */
      this.books = [];
      this.store.dispatch(loadBooks({ category: this.category }));
      // localStorage.setItem('books', JSON.stringify(this.books$));

      this.books$
        .pipe(
          take(2), // Ensure only one subscription execution per category change
          filter(() => this.category !== '') // Prevent execution if category is null
        )
        .subscribe((books) => {
          if (this.category) {
            const scopedbooks = books.map((book) => ({
              ...book,
              inventoryStatus: book.inventoryStatus || 'available',
            }));

            this.books = scopedbooks;
            console.log(
              'Books from store:',
              `books_${this.category}`,
              scopedbooks
            );
            localStorage.setItem(
              `books_${this.category}`,
              JSON.stringify(scopedbooks)
            );
            this.cd.detectChanges();
            this.updateTable();
            this.calculateBorrowedAndAvailableTrends([this.category]);
          }
        });
    }
  }

  onCategoryChange(category: string) {
    this.category = category;
    this.loadBooksFromLocalStorage();
    this.calculateBorrowedAndAvailableTrends([this.category]);
  }

  /**
   * Change Yes and No to actual actions.
   */
  deleteSelectedBooks() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected books?',
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
        this.updateTable();
        this.calculateBorrowedAndAvailableTrends([this.category]);

        this.bookService.updateTotalBooks(this.books.length);
        setTimeout(() => {  // ✅ Ensures the latest value is captured
          this.bookService.totalBooks$.subscribe(count => console.log('After delete:', count));
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
        this.updateTable();
        this.calculateBorrowedAndAvailableTrends([this.category]);

        this.bookService.updateTotalBooks(this.books.length);
        setTimeout(() => {  // ✅ Ensures the latest value is captured
          this.bookService.totalBooks$.subscribe(count => console.log('After delete:', count));
        });


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
        book.inventoryStatus === 'available' ? 'Checked Out' : 'available',
    };

    const index = this.books.findIndex((b) => b.author_key === book.author_key);
    if (index !== -1) {
      this.books[index] = updatedBook;
    }

    localStorage.setItem(`books_${this.category}`, JSON.stringify(this.books));
    this.updateTable();
    this.calculateBorrowedAndAvailableTrends([this.category]);
  }

  // bookDetail(book: BookDoc) {
  //   this.selectedBook = book;
  //   // console.log(this.selectedBook);
  // }

  // closeBookDetail() {
  //   this.selectedBook = null;
  // }

  openNew() {
    this.selectedBook = null; // Reset form for new book
    this.isEditMode = false;
    this.displayDialog = true;
    this.editDialog = false;
    console.log('ADD');
    // this.router.navigate(['/add-book'], {
    //   state: { action: 'new', category: this.category },
    // });
  }
  editBook(book: BookDoc) {
    this.isEditMode = true;
    this.selectedBook = { ...book };
    // this.bookForm.patchValue(book); // Prepopulate the form with the book's data
    this.editDialog = true;
    this.displayDialog = false;
    // const authorKey = Array.isArray(book.author_key)
    //   ? book.author_key[0]
    //   : book.author_key;
    // this.router.navigate(['/edit-book', authorKey], {
    //   state: { action: 'edit', book, category: this.category },
    // });
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
      this.books[index] = book;
      this.store.dispatch(editBook({ book }));
      this.messageService.add({
        severity: 'success',
        summary: 'Successful',
        detail: 'Book Updated',
        life: 3000,
      });
    } else {
      this.books.push(book);
      this.store.dispatch(addBook({ book }));
      this.messageService.add({
        severity: 'success',
        summary: 'Successful',
        detail: 'Book Added',
        life: 3000,
      });
    }
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

  // onChange() {
  //   this.router.navigate(['categories']);
  // }

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

  // onCategorySelected(category: string) {
  //   this.category = category;
  //   this.loadBooksFromLocalStorage();
  // }
}
