import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { BookService } from '../services/book.service';
import { loadBooks } from '../state/book.actions';
import { Store } from '@ngrx/store';
import { BookDoc } from '../models/book.model';
import { AppState } from '../state/book.reducer';

@Component({
  standalone: true,
  selector: 'app-book-form',
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    ConfirmDialogModule,
    DropdownModule,
    ReactiveFormsModule,
  ],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.css',
})
export class BookFormComponent implements OnInit {
  @Input() displayDialog: boolean = true;
  @Input() book: BookDoc|null = null;
  @Output() save = new EventEmitter<BookDoc>();
  @Output() cancel = new EventEmitter<void>();
  @Input() editDialog: boolean = false;

  bookForm!: FormGroup;
  authorKey: string | null = null;
  category: string | null = null;

  inventoryOptions = [
    { label: 'AVAILABLE', value: 'available' },
    { label: 'CHECKED OUT', value: 'Checked Out' },
  ];

  submitted: boolean = false;

  // book = { title: '', author: '', category: '' };
  bookId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private bookService: BookService,
    private store: Store<AppState>
  ) {
    this.bookForm = this.fb.group({
      title: [this.book?.title || '', Validators.required],
      // subtitle:['',Validators.required],
      author_name: [this.book?.author_name || '', Validators.required],
      first_publish_year: [
        this.book?.first_publish_year || '',
        Validators.required,
      ],
      author_key: [this.book?.author_key || '', Validators.required],
      inventoryStatus: [this.book?.inventoryStatus || 'available'],
      subtitle: [this.book?.subtitle||''],
    });
  }

  ngOnInit() {
    // if (this.bookId) {
    //   this.bookForm.patchValue(this.book);
    // }

    this.authorKey = this.route.snapshot.paramMap.get('authorKey');
    this.category = this.route.snapshot.paramMap.get('category')|| history.state.category;
    console.log('Author Key', this.authorKey);
    console.log('Category', this.category);
    if (this.authorKey && this.category) {
      const storedBooks = localStorage.getItem(`books_${this.category}`);
      console.log(storedBooks);
      if (storedBooks) {
        const books = JSON.parse(storedBooks);
        const foundBook = books.find((b: BookDoc) => {
          const bookAuthorKey = Array.isArray(b.author_key)
            ? b.author_key[0]
            : b.author_key;
          return bookAuthorKey === this.authorKey;
        });
        console.log('found book', foundBook);
        if (foundBook) {
          // Patch form with existing data
          this.bookForm.patchValue(foundBook);
          this.displayDialog = false;
          this.editDialog = true;
        }
      }
    }
    // this.editDialog = true;
  }

  onSave(): void {
    if (this.bookForm.valid) {
      // this.bookForm.patchValue({
      //   inventoryStatus: 'Available'
      // });
      this.save.emit(this.bookForm.value);
      const newBook = this.bookForm.value;
      console.log('Saving Book:', this.bookForm.value);
      
      newBook.category = this.category;

      newBook.author_name = [newBook.author_name];
      newBook.author_key = [newBook.author_key];
      const storedBooks = localStorage.getItem(`books_${this.category}`);

      const books = storedBooks ? JSON.parse(storedBooks) : [];
      books.push(newBook);
      localStorage.setItem(`books_${this.category}`, JSON.stringify(books));
      this.store.dispatch(loadBooks({ category: newBook.category }));

      this.router.navigate(['/book-list',{ category: this.category }]);
    }
  }

  oneditSave(): void {
    if (this.bookForm.valid) {
      const updatedBook = this.bookForm.value;
      console.log('Editing Book:', updatedBook);

      updatedBook.author_key = Array.isArray(updatedBook.author_key)
        ? updatedBook.author_key
        : [updatedBook.author_key];
      updatedBook.author_name = Array.isArray(updatedBook.author_name)
        ? updatedBook.author_name
        : [updatedBook.author_name];

      if (
        typeof updatedBook.inventoryStatus === 'object' &&
        updatedBook.inventoryStatus.value
      ) {
        updatedBook.inventoryStatus = updatedBook.inventoryStatus.value;
      }

      updatedBook.category = this.category;
      // updatedBook.author_key = Array.isArray(updatedBook.author_key)
      //   ? updatedBook.author_key[0]
      //   : updatedBook.author_key;

      // Update localStorage with the new/edited book
      const storedBooks = localStorage.getItem(`books_${this.category}`);
      const books = storedBooks ? JSON.parse(storedBooks) : [];

      // If editing, replace existing; otherwise push
      const index = books.findIndex((b: BookDoc) => {
        const bookAuthorKey = Array.isArray(b.author_key)
          ? b.author_key[0]
          : b.author_key;

        const updatedAuthorKey = updatedBook.author_key[0];

        console.log(`Checking: ${bookAuthorKey} === ${updatedAuthorKey}`);
        return bookAuthorKey === updatedBook.author_key[0];
      });
      if (index > -1) {
        books[index] = updatedBook; // Edit
        console.log('Book updated:', updatedBook);
      } else {
        console.warn('Book not found, adding as new instead.');
        books.push(updatedBook); // Add
      }

      localStorage.setItem(`books_${this.category}`, JSON.stringify(books));

      // Close dialog and navigate back to list
      this.editDialog = false;
      this.router.navigate(['/book-list',{ category: this.category }]);
    }
  }

  onCancel() {
    this.displayDialog = false;
    this.editDialog = false;
    this.submitted = false;
    this.cancel.emit();
    this.router.navigate(['/book-list',{ category: this.category }]);
  }
}
