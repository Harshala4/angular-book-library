import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { HeaderComponent } from './header/header.component';
import { BookListComponent } from "./book-list/book-list.component";

@Component({
  selector: 'app-root',
  imports: [
    TableModule,
    RouterOutlet,
    ButtonModule,
    AutoCompleteModule,
    HeaderComponent,
    BookListComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  totalBooks: number = 0;
  title = 'book-library-management';

  constructor(private primeng: PrimeNG) {}

  ngOnInit() {
    this.primeng.ripple.set(true);
  }
}
