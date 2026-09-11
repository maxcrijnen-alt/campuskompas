import type { Metadata } from 'next';
import { ResetPassword } from '@/components/admin/reset-password';

export const metadata: Metadata = {
  title: 'Wachtwoord wijzigen',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPassword />;
}
