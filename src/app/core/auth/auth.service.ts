import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../api/api.config';

export const AUTHENTICATED_USER_KEY = 'doclib.user';
export const TOKEN_KEY = 'doclib.token';

interface Session {
  username: string;
  token: string;
}

/**
 * HTTP Basic authentication against `GET {apiUrl}/login`.
 * The session lives in `sessionStorage` and is exposed as signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_CONFIG);

  private readonly session = signal<Session | null>(readSession());

  readonly username = computed(() => this.session()?.username ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  login(username: string, password: string): Observable<void> {
    const token = 'Basic ' + btoa(`${username}:${password}`);
    const headers = new HttpHeaders({ Authorization: token });
    return this.http.get<{ message: string }>(`${this.api.apiUrl}/login`, { headers }).pipe(
      map(() => {
        sessionStorage.setItem(AUTHENTICATED_USER_KEY, username);
        sessionStorage.setItem(TOKEN_KEY, token);
        this.session.set({ username, token });
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(AUTHENTICATED_USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    this.session.set(null);
  }
}

function readSession(): Session | null {
  const username = sessionStorage.getItem(AUTHENTICATED_USER_KEY);
  const token = sessionStorage.getItem(TOKEN_KEY);
  return username && token ? { username, token } : null;
}
