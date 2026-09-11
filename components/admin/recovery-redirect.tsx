'use client';

import { useEffect } from 'react';

export function RecoveryRedirect() {
  useEffect(() => {
    if (window.location.pathname === '/admin/reset-password') return;
    const parameters = new URLSearchParams(window.location.hash.slice(1));
    const isRecovery = parameters.get('type') === 'recovery';
    const isRecoveryError =
      parameters.has('error_description') && parameters.has('error_code');
    if (!isRecovery && !isRecoveryError) return;

    const target = new URL('/admin/reset-password', window.location.origin);
    target.hash = window.location.hash;
    window.location.replace(target);
  }, []);

  return null;
}
