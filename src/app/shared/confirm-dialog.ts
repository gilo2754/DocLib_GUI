import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as a destructive action. */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based replacement for `window.confirm()`:
 *
 * ```ts
 * if (!(await this.confirmService.confirm({ title: '…', message: '…' }))) return;
 * ```
 *
 * Rendered by the single `<app-confirm-dialog />` in the app shell.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly pending = signal<PendingConfirm | null>(null);
  readonly current = this.pending.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    // a new request supersedes an open one (which counts as cancelled)
    this.pending()?.resolve(false);
    return new Promise((resolve) => this.pending.set({ ...options, resolve }));
  }

  close(confirmed: boolean): void {
    const pending = this.pending();
    if (!pending) return;
    this.pending.set(null);
    pending.resolve(confirmed);
  }
}

/**
 * Modal confirmation dialog based on the native `<dialog>` element
 * (focus trapping, Esc to cancel and the backdrop come from the browser).
 * Clicking the backdrop intentionally does not dismiss it: destructive
 * confirmations require an explicit choice.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      data-testid="confirm-dialog"
      (close)="confirm.close(false)"
    >
      @if (confirm.current(); as request) {
        <h2 id="confirm-title">{{ request.title }}</h2>
        <p id="confirm-message">{{ request.message }}</p>
        <div class="dialog__actions">
          <button type="button" class="btn btn-ghost" autofocus (click)="confirm.close(false)">
            {{ request.cancelLabel ?? 'Abbrechen' }}
          </button>
          <button
            type="button"
            class="btn"
            [class.btn-primary]="!request.danger"
            [class.btn-danger-filled]="request.danger"
            data-testid="confirm-ok"
            (click)="confirm.close(true)"
          >
            {{ request.confirmLabel ?? 'OK' }}
          </button>
        </div>
      }
    </dialog>
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.confirm.current() && !el.open) el.showModal();
      if (!this.confirm.current() && el.open) el.close();
    });
  }
}
