import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { CategoryService } from '../services/category.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Category } from '../models/category.model';

@Component({
  standalone: true,
  selector: 'app-category-selector',
  imports: [
    AutoCompleteModule,
    DropdownModule,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './category-selector.component.html',
  styleUrl: './category-selector.component.css',
})
export class CategorySelectorComponent implements OnInit {
  // categories: string[] = [];
  categories: { label: string; value: string }[] = [];
  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}
  selectedCategory: string = '';
  @Output() categoryChange = new EventEmitter<string>();

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((categories: Category[]) => {
      this.categories = categories.map((category) => ({
        label: category,
        value: category,
      }));
    }); // Extract categories from JSON
  }
  onCategoryChange(event: { originalEvent: Event; value: string }) {
    this.selectedCategory = event.value;
    console.log('Selected Category:', this.selectedCategory);
    console.log('Event:', event.value);
    this.categoryChange.emit(this.selectedCategory);
    // this.router.navigate(['/books', this.selectedCategory]);
  }
}
