import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { AvatarModule } from 'primeng/avatar';

import { BadgeModule } from 'primeng/badge';
import { Router } from '@angular/router';
import { BookService } from '../services/book.service';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { Category } from '../models/category.model';
import { MenuItem } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [
    MenubarModule,
    AvatarModule,
    BadgeModule,
    CommonModule,
    ButtonModule,
    FormsModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  items: MenuItem[] = [];
  categories: Category[] = [];
  searchText: string = '';

  constructor(
    private bookService: BookService,
    private router: Router,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    // Fetch book categories dynamically
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = [...new Set(categories)];

        // Unique categories

        // Define menu items
        this.items = [
          {
            label: 'Home',
            icon: 'pi pi-home',
            command: () => this.router.navigate(['/books']),
          },
          {
            label: 'Categories',
            icon: 'pi pi-list',
            items: this.categories.map((category) => ({
              label: category,
              command: () => this.filterByCategory(category),
            })),
          },
        ];
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.categories = []; // ✅ Prevents undefined errors
      },
    });
  }

  // Function to filter books based on category
  filterByCategory(category: string) {
    this.router.navigate(['/books'], { queryParams: { category } });
  }

  // Function to search books
  searchBooks() {
    if (this.searchText.trim() !== '') {
      this.router.navigate(['/books'], {
        queryParams: { search: this.searchText },
      });
    }
  }
}
