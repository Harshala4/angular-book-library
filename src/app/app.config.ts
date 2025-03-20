import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { bookReducer } from './state/book.reducer';
import { provideEffects } from '@ngrx/effects';
import { BookEffects } from './state/book.effect';
import { BookService } from './services/book.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false,
        },
      },
    }),
    provideHttpClient(), // Required for API calls
    provideStore({ books: bookReducer }), // Provide NgRx Store globally
    provideEffects([BookEffects]), // Provide NgRx Effects for async actions
    BookService,
  ],
};
