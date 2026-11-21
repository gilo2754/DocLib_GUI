import { HttpErrorResponse } from '@angular/common/http';

/** Maps HTTP errors to user friendly (German) messages. */
export function errorMessage(error: unknown, fallback = 'Es ist ein Fehler aufgetreten.'): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  switch (error.status) {
    case 0:
      return 'Server nicht erreichbar. Bitte später erneut versuchen.';
    case 400:
      return typeof error.error === 'string' && error.error.includes('appointment')
        ? 'Praxen mit offenen Terminen können nicht gelöscht werden.'
        : 'Ungültige Anfrage.';
    case 401:
      return 'Benutzername oder Passwort ist falsch.';
    case 404:
      return 'Der Eintrag wurde nicht gefunden.';
    case 409:
      return 'Dieser Termin wurde gerade vergeben. Bitte einen anderen wählen.';
    default:
      return fallback;
  }
}
