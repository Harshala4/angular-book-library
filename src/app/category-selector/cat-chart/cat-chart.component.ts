// import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
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
  inventoryStatus: 'Available' | 'Checked Out';
}

@Component({
  standalone: true,
  selector: 'app-cat-chart',
  imports: [ChartModule],
  templateUrl: './cat-chart.component.html',
  styleUrl: './cat-chart.component.css',
})
export class CatChartComponent implements OnInit, OnChanges {
  @Input() borrowedBooksByCategory: { [key: string]: number } = {};
  borrowedData: unknown = null;
  borrowedOptions: ChartOptions<'bar'> | null = null;
  platformId = inject(PLATFORM_ID);

  constructor(private cd: ChangeDetectorRef, private http: HttpClient) {}

  ngOnInit() {
    this.initializeCategories(); // Ensure all categories have 100 books initially
    // ✅ Load data from localStorage on component initialization
    this.loadChartData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['borrowedBooksByCategory']) {
      this.loadChartData(); // ✅ Ensure chart updates when input changes
    }
  }

  initializeCategories() {
    this.http
      .get<{ categories: string[] }>('/assets/categories.json')
      .subscribe((data) => {
        const categoryList = data.categories;

        // Retrieve existing trends from localStorage or initialize empty objects
        const availableTrends: { [key: string]: number } = JSON.parse(
          localStorage.getItem('available_trends') || '{}'
        );
        const borrowedTrends: { [key: string]: number } = JSON.parse(
          localStorage.getItem('borrowed_trends') || '{}'
        );

        let isUpdated = false;

        categoryList.forEach((category) => {
          const storageKey = `books_${category}`;
          const bookList = JSON.parse(
            localStorage.getItem(storageKey) || 'null'
          );

          if (!bookList) {
            // ✅ If no key exists for this category, assume 100 available books & 0 borrowed

            availableTrends[category] = 100;

            borrowedTrends[category] = 0;
            isUpdated = true;
          } else {
            // ✅ If key exists, extract correct counts
            const borrowedBooks = bookList.filter(
              (book: Book) => book.inventoryStatus === 'Checked Out'
            ).length;
            availableTrends[category] = bookList.length - borrowedBooks;
            borrowedTrends[category] = borrowedBooks;
            isUpdated=true;
          }
        });

        // ✅ Only update localStorage if new values were added
        if (isUpdated) {
          localStorage.setItem(
            'available_trends',
            JSON.stringify(availableTrends)
          );
          localStorage.setItem(
            'borrowed_trends',
            JSON.stringify(borrowedTrends)
          );
        }

        // ✅ Update chart with final values
        this.updateChart(availableTrends, borrowedTrends);
      });
  }

  /**
   * Fetches available and borrowed books from localStorage and updates the chart.
   */
  loadChartData() {
    const borrowedTrends = JSON.parse(
      localStorage.getItem('borrowed_trends') || '{}'
    );
    const availableTrends = JSON.parse(
      localStorage.getItem('available_trends') || '{}'
    );

    this.updateChart(availableTrends, borrowedTrends);
  }

  /**
   * Updates the Borrowed vs Available Books Chart.
   */
  updateChart(
    availableTrends: { [key: string]: number },
    borrowedTrends: { [key: string]: number }
  ) {
    const categories = Object.keys(availableTrends);
    const borrowedCounts = categories.map((cat) => borrowedTrends[cat] || 0);
    const availableCounts = categories.map((cat) => availableTrends[cat] || 0);

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
      maintainAspectRatio: false,
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

    this.cd.markForCheck(); // ✅ Ensure Angular detects changes
  }
}
