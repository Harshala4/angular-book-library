import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
@Component({
  standalone:true,
  selector: 'app-book-form',
  imports: [FormsModule,DialogModule],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.css'
})
export class BookFormComponent {
  
    book = { title: '', author: '', category: '' };
  
    saveBook(): void {
      console.log('Saving Book:', this.book);
    }
}
