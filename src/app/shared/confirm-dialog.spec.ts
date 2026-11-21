import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog, ConfirmService } from './confirm-dialog';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    service = TestBed.inject(ConfirmService);
  });

  it('resolves with the user decision', async () => {
    const yes = service.confirm({ title: 'T', message: 'M' });
    service.close(true);
    expect(await yes).toBe(true);

    const no = service.confirm({ title: 'T', message: 'M' });
    service.close(false);
    expect(await no).toBe(false);
    expect(service.current()).toBeNull();
  });

  it('cancels a pending request when a new one is opened', async () => {
    const first = service.confirm({ title: 'first', message: '' });
    const second = service.confirm({ title: 'second', message: '' });
    expect(await first).toBe(false);
    expect(service.current()?.title).toBe('second');
    service.close(true);
    expect(await second).toBe(true);
  });

  it('ignores close() without a pending request', () => {
    expect(() => service.close(true)).not.toThrow();
  });
});

describe('ConfirmDialog', () => {
  let service: ConfirmService;
  let dialog: HTMLDialogElement;

  // jsdom does not implement the modal API of <dialog> (all evergreen browsers do);
  // minimal stand-ins that behave like the browser for open/close.
  beforeAll(() => {
    const proto = HTMLDialogElement.prototype;
    proto.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });

  beforeEach(async () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    service = TestBed.inject(ConfirmService);
    await fixture.whenStable();
    dialog = (fixture.nativeElement as HTMLElement).querySelector('dialog')!;
  });

  const stable = () => TestBed.inject(ApplicationRef).whenStable();

  /** Opens the dialog and waits for rendering; `result` settles once the user decides. */
  async function open(danger = true) {
    const result = service.confirm({
      title: 'Termin stornieren?',
      message: 'Wirklich?',
      confirmLabel: 'Stornieren',
      cancelLabel: 'Termin behalten',
      danger,
    });
    await stable();
    return { result };
  }

  it('is closed until a confirmation is requested', () => {
    expect(dialog.open).toBe(false);
  });

  it('opens as a modal with title, message and labelled buttons', async () => {
    await open();
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('Termin stornieren?');
    expect(dialog.textContent).toContain('Wirklich?');
    const ok = dialog.querySelector<HTMLButtonElement>('[data-testid="confirm-ok"]')!;
    expect(ok.textContent?.trim()).toBe('Stornieren');
    expect(ok.classList).toContain('btn-danger-filled');
  });

  it('uses the primary style for non-destructive confirmations', async () => {
    await open(false);
    const ok = dialog.querySelector('[data-testid="confirm-ok"]')!;
    expect(ok.classList).toContain('btn-primary');
  });

  it('resolves true and closes when confirming', async () => {
    const { result } = await open();
    dialog.querySelector<HTMLButtonElement>('[data-testid="confirm-ok"]')!.click();
    expect(await result).toBe(true);
    await stable();
    expect(dialog.open).toBe(false);
  });

  it('resolves false when clicking the cancel button', async () => {
    const { result } = await open();
    [...dialog.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('behalten'))!
      .click();
    expect(await result).toBe(false);
  });

  it('resolves false when the dialog is closed by the browser (Esc)', async () => {
    const { result } = await open();
    dialog.dispatchEvent(new Event('close'));
    expect(await result).toBe(false);
  });
});
