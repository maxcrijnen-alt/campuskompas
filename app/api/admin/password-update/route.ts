import { z } from 'zod';
import { failure, json, readJson, sameOrigin } from '@/lib/server/http';
import { serviceDb, tokenDb } from '@/lib/server/supabase';

const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const parsed = z
      .object({
        access_token: z.string().min(100).max(4096),
        password: passwordSchema,
      })
      .strict()
      .safeParse(await readJson(request, 10000));
    if (!parsed.success) throw new Error('INVALID_INPUT');

    const authenticated = tokenDb(parsed.data.access_token);
    const {
      data: { user },
      error: userError,
    } = await authenticated.auth.getUser(parsed.data.access_token);
    if (userError || !user) throw new Error('UNAUTHORIZED');

    const { data: profile } = await authenticated
      .from('admin_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!profile) throw new Error('FORBIDDEN');

    const { error } = await serviceDb().auth.admin.updateUserById(user.id, {
      password: parsed.data.password,
    });
    if (error) throw new Error('SERVICE_UNAVAILABLE');
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
