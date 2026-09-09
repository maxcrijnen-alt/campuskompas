import { publicDb, serviceDb } from '@/lib/server/supabase';
import {
  boundedBody,
  device,
  failure,
  json,
  sameOrigin,
} from '@/lib/server/http';
import { gemSchema, imageType, photoLimit } from '@/lib/campus/validation';
export async function GET() {
  try {
    const { data, error } = await publicDb()
      .from('hidden_gems')
      .select(
        'id,slug,title,description,category,location_id,status,featured,photo_path,likes,created_at',
      )
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return json({ gems: data });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  let uploaded: string | null = null;
  try {
    sameOrigin(request);
    const bytes = await boundedBody(request, photoLimit + 20000);
    const body = await new Response(bytes, {
      headers: { 'content-type': request.headers.get('content-type') ?? '' },
    }).formData();
    const parsed = gemSchema.safeParse({
      title: body.get('title'),
      description: body.get('description'),
      category: body.get('category'),
      location_id: body.get('location_id'),
      website: body.get('website') ?? '',
      started_at: Number(body.get('started_at')),
    });
    if (
      !parsed.success ||
      Date.now() - parsed.data.started_at < 3000 ||
      Date.now() - parsed.data.started_at > 86400000
    )
      throw new Error('INVALID_INPUT');
    const db = serviceDb(),
      identity = await device(request);
    const { data: place } = await db
      .from('locations')
      .select('id')
      .eq('id', parsed.data.location_id)
      .eq('status', 'approved')
      .maybeSingle();
    if (!place) throw new Error('INVALID_INPUT');
    const { error: limitError } = await db.rpc('consume_limit', {
      p_key: identity.hash + ':submit',
      p_max: 5,
      p_window: 3600,
    });
    if (limitError) throw new Error('RATE_LIMIT');
    const photo = body.get('photo');
    if (photo instanceof File && photo.size) {
      if (photo.size > photoLimit) throw new Error('TOO_LARGE');
      const buffer = new Uint8Array(await photo.arrayBuffer()),
        mime = imageType(buffer);
      if (!mime || photo.type !== mime) throw new Error('INVALID_INPUT');
      uploaded =
        crypto.randomUUID() +
        '.' +
        (mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'webp');
      const { error } = await db.storage
        .from('gem-photos')
        .upload(uploaded, buffer, { contentType: mime, upsert: false });
      if (error) throw error;
    }
    const { title, description, category, location_id } = parsed.data;
    const { error } = await db
      .from('hidden_gems')
      .insert({
        title,
        description,
        category,
        location_id,
        photo_path: uploaded,
        status: 'pending',
        slug: crypto.randomUUID(),
      });
    if (error) throw error;
    return json({ ok: true }, 201, { 'Set-Cookie': identity.cookie });
  } catch (e) {
    if (uploaded) {
      try {
        await serviceDb().storage.from('gem-photos').remove([uploaded]);
      } catch {}
    }
    return failure(e);
  }
}
