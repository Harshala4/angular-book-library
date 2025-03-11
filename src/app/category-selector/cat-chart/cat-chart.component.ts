import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { AppConfigService } from '../../services/appconfig.service';
import { ChartModule } from 'primeng/chart';
import { Store } from '@ngrx/store';
import { BookListComponent } from '../../book-list/book-list.component';
import { HttpClient } from '@angular/common/http';

interface Book {
  title: string;
  author: string;
  category: string;
  inventoryStatus: 'available'|'Checked Out'; // Ensure this field exists
}

@Component({
  standalone: true,
  selector: 'app-cat-chart',
  imports: [ChartModule],
  templateUrl: './cat-chart.component.html',
  styleUrl: './cat-chart.component.css',
})

export class CatChartComponent implements OnInit {
  borrowedData: any;
  borrowedOptions: any;
  basicData: any;
  basicOptions: any;

  platformId = inject(PLATFORM_ID);
  configService = inject(AppConfigService);

  constructor(
    private cd: ChangeDetectorRef,
    private store: Store<{ books: any[] }>,
    private http: HttpClient
  ) {}

  themeEffect = effect(() => {
    if (this.configService.transitionComplete()) {
      this.initChart();
    }
  });

  ngOnInit() {
    this.initChart();
    this.loadBorrowedTrends();
  }

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadBooksPerCategory();
    }
  }

  // loadBooksPerCategory() {
  //   // 1️⃣ Fetch books from local storage
  //   let books: any[] = [];
  //   for (let key in localStorage) {
  //     if (key.startsWith('books_')) {
  //       const category = key.replace('books_', '');
  //       const bookList = JSON.parse(localStorage.getItem(key) || '[]');
  //       books.push({ category, count: bookList.length });
  //     }
  //   }

  //   // 2️⃣ Extract categories and counts
  //   const categories = books.map((b) => b.category);
  //   const counts = books.map((b) => b.count);

  //   // 3️⃣ Define chart colors
  //   const colors = [
  //     'rgba(249, 115, 22, 0.2)',
  //     'rgba(6, 182, 212, 0.2)',
  //     'rgb(107, 114, 128, 0.2)',
  //     'rgba(139, 92, 246, 0.2)',
  //   ];

  //   // 4️⃣ Set Chart Data
  //   const documentStyle = getComputedStyle(document.documentElement);
  //   const textColor = documentStyle.getPropertyValue('--p-text-color');
  //   const textColorSecondary = documentStyle.getPropertyValue(
  //     '--p-text-muted-color'
  //   );
  //   const surfaceBorder = documentStyle.getPropertyValue(
  //     '--p-content-border-color'
  //   );

  //   this.basicData = {
  //     labels: categories, // Dynamic categories from localStorage
  //     datasets: [
  //       {
  //         label: 'Books per Category',
  //         data: counts, // Book counts
  //         backgroundColor: colors.slice(0, categories.length),
  //         borderColor: colors
  //           .slice(0, categories.length)
  //           .map((color) => color.replace('0.2', '1')),
  //         borderWidth: 1,
  //       },
  //     ],
  //   };

  //   this.basicOptions = {
      
  //     plugins: {
  //       legend: {
  //         labels: { color: textColor },
  //       },
  //     },
  //     scales: {
  //       x: {
  //         ticks: { color: textColorSecondary },
  //         grid: { color: surfaceBorder },
  //       },
  //       y: {
  //         beginAtZero: true,
  //         ticks: { color: textColorSecondary },
  //         grid: { color: surfaceBorder },
  //       },
  //     },
  //   };

  //   this.cd.markForCheck();
  // }
  loadBooksPerCategory() {
    this.http.get<{ categories: string[] }>('/assets/categories.json').subscribe(
      (data) => {
        const categoriesJson = data.categories; // Extract array from JSON
        let books: any[] = [];
  
        categoriesJson.forEach((category: string) => {
          const key = `books_${category}`;
          const bookList = JSON.parse(localStorage.getItem(key) || '[]');
          const bookCount = bookList.length > 0 ? bookList.length : 100; // Default to 100 if no data
  
          books.push({ category, count: bookCount });
        });
  
        // Extract categories and counts
        const categories = books.map((b) => b.category);
        const counts = books.map((b) => b.count);
  
        // Define chart colors
        const colors = [
          'rgba(249, 115, 22, 0.2)',
          'rgba(6, 182, 212, 0.2)',
          'rgb(107, 114, 128, 0.2)',
          'rgba(139, 92, 246, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ];
  
        // Get Theme Colors
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--p-text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
        const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');
  
        // Assign Chart Data
        this.basicData = {
          labels: categories,
          datasets: [
            {
              label: 'Books per Category',
              data: counts,
              backgroundColor: colors.slice(0, categories.length),
              borderColor: colors.slice(0, categories.length).map((color) => color.replace('0.2', '1')),
              borderWidth: 1,
            },
          ],
        };
  
        this.cd.markForCheck();
      },
      (error) => console.error('Error loading categories:', error)
    );
  }
  

  loadBorrowedTrends() {
    if (isPlatformBrowser(this.platformId)) {
        let borrowedTrends: { [category: string]: number } = {};

        for (let key in localStorage) {
            if (key.startsWith('books_')) {
                const category = key.replace('books_', '');
                const bookList:Book[] = JSON.parse(localStorage.getItem(key) || '[]');

                // Filter books that are checked out (assuming `isCheckedOut: true` is in the object)
                const borrowedBooks = bookList.filter((book:Book) => book.inventoryStatus === 'Checked Out');
                
                // Store the count of borrowed books per category
                borrowedTrends[category] = borrowedBooks.length;
            }
        }

        const categories = Object.keys(borrowedTrends);
        const borrowedCounts = Object.values(borrowedTrends);

        this.borrowedData = {
            labels: categories,
            datasets: [
                {
                    label: 'Borrowed Books',
                    data: borrowedCounts,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
            ],
        };

        this.borrowedOptions = {
            responsive: true,
            // maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#333' } },
            },
            scales: {
                x: { ticks: { color: '#666' }, grid: { color: '#ddd' } },
                y: { beginAtZero: true, ticks: { color: '#666' }, grid: { color: '#ddd' } },
            },
        };

        this.cd.markForCheck();
    }
}
}
