import { publicDb, requireAdmin, serviceDb } from '@/lib/server/supabase';
import { failure } from '@/lib/server/http';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let db = publicDb();
    if (new URL(request.url).searchParams.has('moderate'))
      db = (await requireAdmin(request)).db;
    const { data } = await db
      .from('hidden_gems')
      .select('photo_path')
      .eq('id', id)
      .maybeSingle();
    if (!data?.photo_path) return new Response(null, { status: 404 });
    const { data: file, error } = await serviceDb()
      .storage.from('gem-photos')
      .download(data.photo_path);
    if (error || !file) throw error;
    return new Response(file, {
      headers: {
        'Content-Type': file.type,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=60',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
