import { adminSchemas, hoursTargetSchema } from '@/lib/campus/validation';
import { failure, json, readJson, sameOrigin } from '@/lib/server/http';
import { requireAdmin } from '@/lib/server/supabase';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db } = await requireAdmin(request);
    const body = await readJson(request, 1_000_000);
    if (!body || typeof body !== 'object') throw new Error('INVALID_INPUT');
    const value = body as Record<string, unknown>;
    const hours = adminSchemas.opening_hours.safeParse(value.hours);
    const target = hoursTargetSchema.nullable().safeParse(value.target);
    if (!hours.success || !target.success) throw new Error('INVALID_INPUT');

    const { data, error } = await db.rpc('admin_save_opening_hours_link', {
      p_hours: hours.data,
      p_target_type: target.data?.target_type ?? null,
      p_target_id: target.data?.target_id ?? null,
    });
    if (error || !data) throw new Error('INVALID_INPUT');

    return json({ ok: true, link: data });
  } catch (error) {
    return failure(error);
  }
}
