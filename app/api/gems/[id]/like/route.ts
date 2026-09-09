import { serviceDb } from '@/lib/server/supabase';
import { device, failure, json, sameOrigin } from '@/lib/server/http';
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('INVALID_INPUT');
    const identity = await device(request);
    const { data, error } = await serviceDb().rpc('vote_gem', {
      p_gem: id,
      p_device: identity.hash,
    });
    if (error)
      throw new Error(
        error.message.includes('RATE_LIMIT') ? 'RATE_LIMIT' : 'INVALID_INPUT',
      );
    return json({ likes: data }, 200, { 'Set-Cookie': identity.cookie });
  } catch (e) {
    return failure(e);
  }
}
