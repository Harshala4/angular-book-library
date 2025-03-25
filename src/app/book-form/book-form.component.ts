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
import {FloatLabelModule} from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';


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
    FloatLabelModule,
    InputTextModule,
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
  

  markTouched(field: string) {
    const control = this.bookForm.get(field);
    if (control) {
      control.markAsTouched();
      control.markAsDirty();
    }
  }

  onCancel() {
    this.visible = false;
    this.displayDialog = false;
    this.editDialog = false;
    this.submitted = false;
    this.cancel.emit();
    // this.router.navigate(['/book-list', { category: this.category }]);
  }
}
