import { publicDb, serviceDb } from '@/lib/server/supabase';
import {
  boundedBody,
  device,
  failure,
  json,
  sameOrigin,
} from '@/lib/server/http';
import { gemSchema, imageType, photoLimit } from '@/lib/campus/validation';
import { validateCanonicalLocation } from '@/lib/server/routing-data';
export async function GET() {
  try {
    const { data, error } = await publicDb()
      .from('hidden_gems')
      .select(
        'id,slug,title,description,category,location_id,location_review_status,proposed_location_name,proposed_building_id,proposed_floor_id,proposed_room_zone,proposed_location_description,proposed_location_source_url,status,featured,photo_path,hours_id,likes,created_at',
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
      location_mode: body.get('location_mode') ?? 'existing',
      location_id: body.get('location_id'),
      proposed_location_name: body.get('proposed_location_name'),
      proposed_building_id: body.get('proposed_building_id'),
      proposed_floor_id: body.get('proposed_floor_id'),
      proposed_room_zone: body.get('proposed_room_zone'),
      proposed_location_description: body.get('proposed_location_description'),
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
    if (parsed.data.location_mode === 'existing') {
      if (
        !parsed.data.location_id ||
        !(await validateCanonicalLocation(db, parsed.data.location_id))
      )
        throw new Error('INVALID_INPUT');
    } else if (parsed.data.proposed_building_id) {
      const { data: building } = await db
        .from('buildings')
        .select('id')
        .eq('id', parsed.data.proposed_building_id)
        .maybeSingle();
      if (!building) throw new Error('INVALID_INPUT');
      if (parsed.data.proposed_floor_id) {
        const { data: floor } = await db
          .from('floors')
          .select('id')
          .eq('id', parsed.data.proposed_floor_id)
          .eq('building_id', parsed.data.proposed_building_id)
          .maybeSingle();
        if (!floor) throw new Error('INVALID_INPUT');
      }
    }
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
    const { title, description, category } = parsed.data;
    const existing = parsed.data.location_mode === 'existing';
    const { error } = await db.from('hidden_gems').insert({
      title,
      description,
      category,
      location_id: existing ? parsed.data.location_id : null,
      location_review_status: existing ? 'linked' : 'proposed',
      proposed_location_name: existing
        ? null
        : parsed.data.proposed_location_name,
      proposed_building_id: existing ? null : parsed.data.proposed_building_id,
      proposed_floor_id: existing ? null : parsed.data.proposed_floor_id,
      proposed_room_zone: existing ? null : parsed.data.proposed_room_zone,
      proposed_location_description: existing
        ? null
        : parsed.data.proposed_location_description,
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
