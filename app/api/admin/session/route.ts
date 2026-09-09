import { publicDb, requireAdmin, tokenDb } from '@/lib/server/supabase';
import { failure, json, readJson, sameOrigin } from '@/lib/server/http';
import { z } from 'zod';
export async function GET(request: Request) {
  try {
    const { user } = await requireAdmin(request);
    return json({ email: user.email });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = z
      .object({
        email: z.email().max(250),
        password: z.string().min(1).max(200),
      })
      .safeParse(await readJson(request));
    if (!body.success) throw new Error('INVALID_INPUT');
    const { data, error } = await publicDb().auth.signInWithPassword(body.data);
    if (error || !data.session) throw new Error('UNAUTHORIZED');
    const db = tokenDb(data.session.access_token);
    const { data: profile } = await db
      .from('admin_profiles')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (!profile) throw new Error('FORBIDDEN');
    return json({ ok: true }, 200, {
      'Set-Cookie': `ck-admin=${data.session.access_token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${data.session.expires_in}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    return json({ ok: true }, 200, {
      'Set-Cookie': 'ck-admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    });
  } catch (e) {
    return failure(e);
  }
}
