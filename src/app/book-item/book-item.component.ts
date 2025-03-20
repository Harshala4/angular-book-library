import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { BookDoc } from '../models/book.model';

@Component({
  selector: 'app-book-item',
  imports: [CommonModule, DialogModule, ConfirmDialogModule, ButtonModule],
  templateUrl: './book-item.component.html',
  styleUrl: './book-item.component.css',
})
export class BookItemComponent {
  productDialog: boolean = true;
  @Input() book: BookDoc | null = null;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.productDialog = false;
    this.close.emit();
  }
}
