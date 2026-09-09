import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/server/supabase';
import { AdminApp } from '@/components/admin/app';
export const metadata: Metadata = {
  title: 'Beheer',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  let email: string | null = null;
  try {
    const { user } = await requireAdmin(
      new Request('http://localhost/admin', { headers: await headers() }),
    );
    email = user.email ?? 'Admin';
  } catch {}
  return <AdminApp section={path?.[0] ?? 'dashboard'} initialEmail={email} />;
}
