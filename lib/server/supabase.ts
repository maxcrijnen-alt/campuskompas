import { createClient } from '@supabase/supabase-js';
export function configured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}
export function publicDb() {
  if (!configured()) throw new Error('SERVICE_UNAVAILABLE');
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function serviceDb() {
  if (!process.env.SUPABASE_URL) throw new Error('SERVICE_UNAVAILABLE');
  const key = process.env.SUPABASE_SECRET_KEY;
  if (key)
    return createClient(process.env.SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  if (
    !process.env.SUPABASE_GATEWAY_SECRET ||
    !process.env.SUPABASE_PUBLISHABLE_KEY
  )
    throw new Error('SERVICE_UNAVAILABLE');
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: gatewayFetch },
    },
  );
}
export const gatewayFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init),
    url = new URL(request.url);
  const target =
    process.env.SUPABASE_URL +
    '/functions/v1/server-gateway?path=' +
    encodeURIComponent(url.pathname + url.search);
  const headers = new Headers(request.headers);
  headers.delete('Authorization');
  headers.set('x-campus-secret', process.env.SUPABASE_GATEWAY_SECRET!);
  return fetch(target, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : await request.arrayBuffer(),
  });
};
export function tokenDb(token: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
}
export async function requireAdmin(request: Request) {
  if (!configured()) throw new Error('SERVICE_UNAVAILABLE');
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('ck-admin='));
  const token = cookie?.slice(9);
  if (!token) throw new Error('UNAUTHORIZED');
  const db = tokenDb(token);
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user) throw new Error('UNAUTHORIZED');
  const { data: admin } = await db
    .from('admin_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) throw new Error('FORBIDDEN');
  return { db, user };
}
