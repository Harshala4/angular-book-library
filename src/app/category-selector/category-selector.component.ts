import { Component, OnInit } from '@angular/core';
import { BookService } from '../services/book.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { BookCategory, CategoryResponse } from '../models/book.model';
// import {map} from 'rxjs';
import { CategoryService } from '../services/category.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CatChartComponent } from './cat-chart/cat-chart.component';

@Component({
  standalone: true,
  selector: 'app-category-selector',
  imports: [AutoCompleteModule, DropdownModule, CommonModule, FormsModule,CatChartComponent],
  templateUrl: './category-selector.component.html',
  styleUrl: './category-selector.component.css',
})
export class CategorySelectorComponent implements OnInit {
  // categories: string[] = [];
  categories: { label: string; value: string }[] = [];
  constructor(private categoryService: CategoryService, private router: Router) {}
  selectedCategory: string | null = null;
  
  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((data) => {
      this.categories = data.categories.map((category: string) => ({
        label: category,
        value: category,
      }));
    }); // Extract categories from JSON
  }
   onCategoryChange(event: any) {
    this.selectedCategory = event.value;
    console.log("Selected Category:", this.selectedCategory);
    console.log("Event:", event.value); 
    this.router.navigate(['/books', this.selectedCategory]);
  }
}
