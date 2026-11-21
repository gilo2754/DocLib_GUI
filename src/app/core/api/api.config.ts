import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ApiConfig {
  apiUrl: string;
  adminApiUrl: string;
}

/** Base URLs of the DocLib REST API; injectable so tests can override them. */
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({ apiUrl: environment.apiUrl, adminApiUrl: environment.adminApiUrl }),
});
