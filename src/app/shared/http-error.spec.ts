import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './http-error';

describe('errorMessage', () => {
  const err = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

  it.each([
    [0, 'nicht erreichbar'],
    [401, 'Passwort'],
    [404, 'nicht gefunden'],
    [409, 'vergeben'],
  ])('maps HTTP %i', (status, text) => {
    expect(errorMessage(err(status))).toContain(text);
  });

  it('explains the delete restriction coming from the backend', () => {
    expect(
      errorMessage(err(400, 'No se pueden borrar clinics si estas contienen appointment')),
    ).toContain('offenen Terminen');
  });

  it('uses the fallback for unknown errors', () => {
    expect(errorMessage(new Error('x'), 'Fallback')).toBe('Fallback');
    expect(errorMessage(err(500), 'Fallback')).toBe('Fallback');
  });
});
