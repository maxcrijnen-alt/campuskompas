'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Compass, KeyRound } from 'lucide-react';

export function ResetPassword() {
  const [accessToken, setAccessToken] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.hash.slice(1));
    const token = parameters.get('access_token');
    const recovery = parameters.get('type') === 'recovery';
    const authError = parameters.get('error_description');
    window.history.replaceState(null, '', window.location.pathname);
    if (token && recovery) setAccessToken(token);
    else
      setError(
        authError
          ? decodeURIComponent(authError.replaceAll('+', ' '))
          : 'Deze resetlink is ongeldig of verlopen. Vraag een nieuwe link aan. / This reset link is invalid or expired. Request a new one.',
      );
    setReady(true);
  }, []);

  async function updatePassword(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const passwordEntry = form.get('password'),
      confirmationEntry = form.get('confirm_password'),
      password = typeof passwordEntry === 'string' ? passwordEntry : '',
      confirmation =
        typeof confirmationEntry === 'string' ? confirmationEntry : '';
    if (password !== confirmation) {
      setError('De wachtwoorden zijn niet gelijk / Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/admin/password-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, password }),
      });
      if (!response.ok)
        throw new Error(
          'Wachtwoord kon niet worden gewijzigd. Vraag een nieuwe resetlink aan. / Password could not be changed. Request a new reset link.',
        );
      setAccessToken('');
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <Link className="wordmark" href="/">
          <span className="logo">
            <Compass />
          </span>
          CampusKompas
        </Link>
        <span className="badge">Beheer / Administration</span>
      </header>
      <main id="main" className="page-wrap">
        <section className="panel reset-password-panel">
          <KeyRound size={28} aria-hidden="true" />
          <h1>Nieuw wachtwoord / New password</h1>
          {complete ? (
            <>
              <p role="status">
                Je wachtwoord is gewijzigd. Log opnieuw in. / Your password has
                been changed. Sign in again.
              </p>
              <Link className="primary-button" href="/admin">
                Naar beheer / Go to admin
              </Link>
            </>
          ) : ready && accessToken ? (
            <form onSubmit={updatePassword}>
              <p className="form-note">
                Gebruik minimaal 12 tekens met hoofdletter, kleine letter,
                cijfer en symbool. / Use at least 12 characters with uppercase,
                lowercase, a number and a symbol.
              </p>
              <label className="field-label">
                Nieuw wachtwoord / New password
                <input
                  className="field-input"
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="field-label">
                Herhaal wachtwoord / Confirm password
                <input
                  className="field-input"
                  name="confirm_password"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className="primary-button" disabled={busy}>
                {busy
                  ? 'Wijzigen… / Updating…'
                  : 'Wachtwoord wijzigen / Update password'}
              </button>
            </form>
          ) : !ready ? (
            <div className="loading" aria-label="Loading" />
          ) : null}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!complete && (
            <Link className="text-link" href="/admin">
              Terug naar inloggen / Back to sign in
            </Link>
          )}
        </section>
      </main>
    </>
  );
}
