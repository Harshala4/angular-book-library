import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
// import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { BookService } from '../services/book.service';
// import { loadBooks } from '../state/book.actions';
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
  @Input() book: BookDoc | null = null;
  @Output() save = new EventEmitter<BookDoc>();
  @Output() cancel = new EventEmitter<void>();
  @Input() editDialog: boolean = false;
  visible: boolean = false;

  checkDialogVisibility(): void {
    if (this.displayDialog || this.editDialog) {
      this.visible = true;
    }
  }

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
    // private route: ActivatedRoute,
    // private router: Router,
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
      subtitle: [this.book?.subtitle || ''],
    });
  }

  ngOnInit() {
    
    this.checkDialogVisibility();
    if (this.bookId) {
      if (this.book) {
        this.bookForm.patchValue(this.book);
      }
    }
    // this.authorKey = this.route.snapshot.paramMap.get('authorKey');
    // this.category =
    //   this.route.snapshot.paramMap.get('category') || history.state.category;
    // console.log('Author Key', this.authorKey);
    // console.log('Category', this.category);
    // if (this.authorKey && this.category) {
    //   const storedBooks = localStorage.getItem(`books_${this.category}`);
    //   console.log(storedBooks);
    //   if (storedBooks) {
    //     const books = JSON.parse(storedBooks);
    //     const foundBook = books.find((b: BookDoc) => {
    //       const bookAuthorKey = Array.isArray(b.author_key)
    //         ? b.author_key[0]
    //         : b.author_key;
    //       return bookAuthorKey === this.authorKey;
    //     });
    //     console.log('found book', foundBook);
    //     if (foundBook) {
    //       // Patch form with existing data
    //       this.bookForm.patchValue(foundBook);
    //       this.displayDialog = false;
    //       this.editDialog = true;
    //     }
    //   }
    // }
  }

  ngOnChanges() {
    this.checkDialogVisibility();
  
    if (this.book) {
      this.bookForm.patchValue(this.book);
    } else {
      this.bookForm.reset({
        title: '',
        subtitle: '',
        author_name: '',
        first_publish_year: '',
        author_key: '',
        inventoryStatus: 'available'
      });
    }
  }
  

  onSave(): void {
    if (this.bookForm.valid) {
      const book = this.bookForm.value;
  
      book.category = this.category;
  
      book.author_key = Array.isArray(book.author_key)
        ? book.author_key
        : [book.author_key];
  
      book.author_name = Array.isArray(book.author_name)
        ? book.author_name
        : [book.author_name];
  
      if (typeof book.inventoryStatus === 'object' && book.inventoryStatus.value) {
        book.inventoryStatus = book.inventoryStatus.value;
      }

      this.save.emit(book);
      this.displayDialog = false;
      this.editDialog = false;
      this.visible=false;
    }
  }
  

  // oneditSave(): void {
  //   if (this.bookForm.valid) {
  //     const updatedBook = this.bookForm.value;
  //     console.log('Editing Book:', updatedBook);

  //     updatedBook.author_key = Array.isArray(updatedBook.author_key)
  //       ? updatedBook.author_key
  //       : [updatedBook.author_key];
  //     updatedBook.author_name = Array.isArray(updatedBook.author_name)
  //       ? updatedBook.author_name
  //       : [updatedBook.author_name];

  //     if (
  //       typeof updatedBook.inventoryStatus === 'object' &&
  //       updatedBook.inventoryStatus.value
  //     ) {
  //       updatedBook.inventoryStatus = updatedBook.inventoryStatus.value;
  //     }

  //     updatedBook.category = this.category;
  //     this.save.emit(updatedBook);

  //     const storedBooks = localStorage.getItem(`books_${this.category}`);
  //     const books = storedBooks ? JSON.parse(storedBooks) : [];

  //     // If editing, replace existing; otherwise push
  //     const index = books.findIndex((b: BookDoc) => {
  //       const bookAuthorKey = Array.isArray(b.author_key)
  //         ? b.author_key[0]
  //         : b.author_key;

  //       const updatedAuthorKey = updatedBook.author_key[0];

  //       console.log(`Checking: ${bookAuthorKey} === ${updatedAuthorKey}`);
  //       return bookAuthorKey === updatedBook.author_key[0];
  //     });
  //     if (index > -1) {
  //       books[index] = updatedBook; // Edit
  //       console.log('Book updated:', updatedBook);
  //     } else {
  //       console.warn('Book not found, adding as new instead.');
  //       books.push(updatedBook); // Add
  //     }

  //     localStorage.setItem(`books_${this.category}`, JSON.stringify(books));

  //     // Close dialog and navigate back to list
  //     this.editDialog = false;
  //     // this.router.navigate(['/book-list', { category: this.category }]);
  //   }
  // }

  onCancel() {
    this.visible = false;
    this.displayDialog = false;
    this.editDialog = false;
    this.submitted = false;
    this.cancel.emit();
    // this.router.navigate(['/book-list', { category: this.category }]);
  }
}
