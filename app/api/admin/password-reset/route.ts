import { z } from 'zod';
import { device, failure, json, readJson, sameOrigin } from '@/lib/server/http';
import { publicDb, serviceDb } from '@/lib/server/supabase';

const responseMessage =
  'If this email has administrator access, a reset link will be sent.';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
  } catch (error) {
    return failure(error);
  }
  const identity = await device(request);
  const response = () =>
    json({ ok: true, message: responseMessage }, 202, {
      'Set-Cookie': identity.cookie,
    });

  try {
    const parsed = z
      .object({ email: z.email().max(250) })
      .strict()
      .safeParse(await readJson(request));
    if (!parsed.success) return response();

    const database = serviceDb();
    const { error: limitError } = await database.rpc('consume_limit', {
      p_key: `${identity.hash}:admin-password-reset`,
      p_max: 3,
      p_window: 3600,
    });
    if (limitError) return response();

    const normalizedEmail = parsed.data.email.trim().toLocaleLowerCase('en');
    const { data: users, error: usersError } =
      await database.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return response();
    const user = users.users.find(
      (candidate) =>
        candidate.email?.toLocaleLowerCase('en') === normalizedEmail,
    );
    if (!user) return response();

    const { data: profile } = await database
      .from('admin_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!profile) return response();

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    await publicDb().auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: new URL('/admin/reset-password', origin).toString(),
    });
    return response();
  } catch {
    return response();
  }
}
