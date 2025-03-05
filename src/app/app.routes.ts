import { Routes } from '@angular/router';
import { BookListComponent } from './book-list/book-list.component';
import { BookFormComponent } from './book-form/book-form.component';
import { CategorySelectorComponent } from './category-selector/category-selector.component';

export const routes: Routes = [
  {
    path: 'books',
    component: BookListComponent,
  },
  {
    path: 'add-book',
    component: BookFormComponent,
  },
  {
    path: 'edit-book/:id',
    component: BookFormComponent,
  },
  {
    path:'category',
    component:CategorySelectorComponent,
  },
  {
    path: '**',
    redirectTo: 'books',
  },
];
