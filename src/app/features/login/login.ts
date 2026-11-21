import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DEMO_USERS } from '../../core/mock-api/seed-data';
import { errorMessage } from '../../shared/http-error';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="narrow">
      <h1>Anmelden</h1>

      @if (demoMode) {
        <p class="alert alert-info" data-testid="demo-hint">
          Demo-Zugang: <strong>{{ demoUser.username }}</strong> /
          <strong>{{ demoUser.password }}</strong>
          <button type="button" class="link" (click)="fillDemo()">übernehmen</button>
        </p>
      }
      @if (error(); as message) {
        <p class="alert alert-error" role="alert">{{ message }}</p>
      }

      <form class="card form" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Benutzername
          <input formControlName="username" autocomplete="username" data-testid="username" />
        </label>
        <label>
          Passwort
          <input
            type="password"
            formControlName="password"
            autocomplete="current-password"
            data-testid="password"
          />
        </label>
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Anmelden …' : 'Anmelden' }}
        </button>
      </form>
    </section>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the `returnUrl` query param (set by the auth guard). */
  readonly returnUrl = input<string>();

  protected readonly demoMode = environment.useMockApi;
  protected readonly demoUser = DEMO_USERS[0];
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: Validators.required }),
    password: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  fillDemo(): void {
    this.form.setValue({ username: this.demoUser.username, password: this.demoUser.password });
  }

  submit(): void {
    if (this.form.invalid) return;
    const { username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl(this.safeReturnUrl());
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  /** Only allow in-app redirects (prevents open redirects via the query param). */
  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/clinics';
  }
}
