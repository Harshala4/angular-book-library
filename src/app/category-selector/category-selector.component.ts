import { Component, OnInit } from '@angular/core';
import { BookService } from '../services/book.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { BookCategory, CategoryResponse } from '../models/book.model';
// import {map} from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-category-selector',
  imports: [AutoCompleteModule, DropdownModule],
  templateUrl: './category-selector.component.html',
  styleUrl: './category-selector.component.css',
})
export class CategorySelectorComponent implements OnInit {
  categories: any[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getBookCategories().subscribe((data: CategoryResponse) => {
      console.log('API Response:', data);
      console.log('Subjects:', data.subjects);
      this.categories = (data.subjects ?? []).map(
        (subject: BookCategory) => subject.name
      );
    });
  }
}
