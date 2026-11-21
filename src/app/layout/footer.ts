import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="app-footer">
      <div class="container">
        <span>DocLib – Demo-Projekt mit Angular 21, Signals &amp; Vitest</span>
        <a href="https://github.com/gilo2754/DocLib_GUI" target="_blank" rel="noopener"
          >Quellcode auf GitHub</a
        >
      </div>
    </footer>
  `,
})
export class Footer {}
