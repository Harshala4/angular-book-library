// import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { HttpClient } from '@angular/common/http';
import { ChartOptions } from 'chart.js';

interface Book {
  title: string;
  category: string;
  inventoryStatus: 'available' | 'Checked Out';
}

@Component({
  standalone: true,
  selector: 'app-cat-chart',
  imports: [ChartModule],
  templateUrl: './cat-chart.component.html',
  styleUrl: './cat-chart.component.css',
})
export class CatChartComponent implements OnInit {
  @Input() borrowedBooksByCategory: { [key: string]: number } = {};
  borrowedData: unknown = null;
  borrowedOptions: ChartOptions<'bar'> | null = null;
  platformId = inject(PLATFORM_ID);

  constructor(private cd: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.initializeCategories(); // Ensure all categories have 100 books initially
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['borrowedBooksByCategory']) {
      const availableTrends = changes['borrowedBooksByCategory'].currentValue;
      const borrowedTrends = this.borrowedBooksByCategory;
      this.updateChart(availableTrends, borrowedTrends);
    }
  }

  /**
   * Ensures each category has an initial available count of 100
   * if real book data is not yet present in localStorage.
   */
  initializeCategories() {
    this.http
      .get<{ categories: string[] }>('/assets/categories.json')
      .subscribe((data) => {
        const categoryList = data.categories;

        // Create placeholders for tracking book counts
        const availableTrends: { [key: string]: number } = {};
        const borrowedTrends: { [key: string]: number } = {};

        categoryList.forEach((category) => {
          const key = `books_${category}`;
          const bookList = JSON.parse(localStorage.getItem(key) || 'null');

          if (!bookList) {
            // ✅ If no data in local storage, assume 100 available books
            availableTrends[category] = 100;
            borrowedTrends[category] = 0;
          } else {
            // ✅ If data exists, use real available/borrowed book count
            const borrowedBooks = bookList.filter(
              (book: Book) => book.inventoryStatus === 'Checked Out'
            ).length;
            availableTrends[category] = bookList.length - borrowedBooks;
            borrowedTrends[category] = borrowedBooks;
          }
        });

        this.updateChart(availableTrends, borrowedTrends);
      });
  }

  /**
   * Updates the Borrowed vs Available Books Chart.
   */
  updateChart(
    availableTrends: { [key: string]: number },
    borrowedTrends: { [key: string]: number }
  ) {
    const categories = Object.keys(availableTrends);
    const borrowedCounts = Object.values(borrowedTrends);
    const availableCounts = Object.values(availableTrends);

    this.borrowedData = {
      labels: categories,
      datasets: [
        {
          label: 'Borrowed Books',
          data: borrowedCounts,
          backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Available Books',
          data: availableCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };

    this.borrowedOptions = {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#333' } },
      },
      scales: {
        x: { ticks: { color: '#666' }, grid: { color: '#ddd' } },
        y: {
          beginAtZero: true,
          ticks: { color: '#666' },
          grid: { color: '#ddd' },
        },
      },
    };

    this.cd.markForCheck();
  }
}
