import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  constructor() {}

  transitionComplete(): boolean {
    return true; // Adjust based on actual logic
  }
}
