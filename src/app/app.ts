import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { ConfirmDialog } from './shared/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <main class="container" id="main">
      <router-outlet />
    </main>
    <app-footer />
    <app-confirm-dialog />
  `,
})
export class App {}
