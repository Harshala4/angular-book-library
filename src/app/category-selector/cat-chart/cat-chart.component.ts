import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { AppConfigService } from '../../services/appconfig.service';
import { ChartModule } from 'primeng/chart';
import { Store } from '@ngrx/store';

@Component({
  standalone:true,
  selector: 'app-cat-chart',
  imports: [ChartModule],
  templateUrl: './cat-chart.component.html',
  styleUrl: './cat-chart.component.css'
})
export class CatChartComponent implements OnInit{
  basicData: any;
    basicOptions: any;

    platformId = inject(PLATFORM_ID);
    configService = inject(AppConfigService);

    constructor(private cd: ChangeDetectorRef, private store: Store<{ books: any[] }>) {}

    themeEffect = effect(() => {
        if (this.configService.transitionComplete()) {
            this.initChart();
        }
    });

    ngOnInit() {
        this.initChart();
    }

    initChart() {
        if (isPlatformBrowser(this.platformId)) {
            this.loadBooksPerCategory();
        }
    }

    loadBooksPerCategory() {
        // 1️⃣ Fetch books from local storage
        let books: any[] = [];
        for (let key in localStorage) {
            if (key.startsWith('books_')) {
                const category = key.replace('books_', '');
                const bookList = JSON.parse(localStorage.getItem(key) || '[]');
                books.push({ category, count: bookList.length });
            }
        }

        // 2️⃣ Extract categories and counts
        const categories = books.map(b => b.category);
        const counts = books.map(b => b.count);

        // 3️⃣ Define chart colors
        const colors = ['rgba(249, 115, 22, 0.2)', 'rgba(6, 182, 212, 0.2)', 'rgb(107, 114, 128, 0.2)', 'rgba(139, 92, 246, 0.2)'];

        // 4️⃣ Set Chart Data
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--p-text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
        const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

        this.basicData = {
            labels: categories, // Dynamic categories from localStorage
            datasets: [
                {
                    label: 'Books per Category',
                    data: counts, // Book counts
                    backgroundColor: colors.slice(0, categories.length),
                    borderColor: colors.slice(0, categories.length).map(color => color.replace('0.2', '1')),
                    borderWidth: 1
                }
            ]
        };

        this.basicOptions = {
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                }
            }
        };

        this.cd.markForCheck();
    }
}
