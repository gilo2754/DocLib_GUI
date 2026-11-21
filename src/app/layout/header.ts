import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth/auth.service';
import { MOCK_DB } from '../core/mock-api/mock-backend.interceptor';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (demoMode) {
      <div class="demo-banner" role="note">
        Demo-Modus: Alle Daten kommen aus einer simulierten API im Browser.
        <button type="button" class="link" (click)="resetDemo()">Demo zurücksetzen</button>
      </div>
    }
    <header class="app-header">
      <nav class="container nav" aria-label="Hauptnavigation">
        <a routerLink="/" class="brand">Doc<span>Lib</span></a>
        <ul>
          <li><a routerLink="/clinics" routerLinkActive="active">Praxen</a></li>
          @if (auth.isLoggedIn()) {
            <li><a routerLink="/appointments" routerLinkActive="active">Meine Termine</a></li>
          }
        </ul>
        <div class="nav-user">
          @if (auth.username(); as user) {
            <span class="muted" data-testid="current-user">{{ user }}</span>
            <button type="button" class="btn btn-ghost" (click)="logout()">Abmelden</button>
          } @else {
            <a routerLink="/login" class="btn btn-primary">Anmelden</a>
          }
        </div>
      </nav>
    </header>
  `,
})
export class Header {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly db = inject(MOCK_DB);
  protected readonly demoMode = environment.useMockApi;

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }

  resetDemo(): void {
    this.db.reset();
    this.auth.logout();
    void this.router.navigateByUrl('/').then(() => location.reload());
  }
}
