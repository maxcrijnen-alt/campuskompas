import { it, expect } from 'vitest';
import { loadTestEnv } from '../scripts/test-env';
import { publicDb, serviceDb, tokenDb } from '../lib/server/supabase';
loadTestEnv();
it.skipIf(!process.env.SUPABASE_URL)(
  'live Supabase permissions, real writes and private storage',
  async () => {
    const db = publicDb();
    const { data: floor, error } = await db.from('floors').select('id');
    expect(error).toBeNull();
    expect(floor).toHaveLength(8);
    const { data: session, error: authError } =
      await db.auth.signInWithPassword({
        email: process.env.TEST_ADMIN_EMAIL!,
        password: process.env.TEST_ADMIN_PASSWORD!,
      });
    expect(authError).toBeNull();
    const admin = tokenDb(session.session!.access_token),
      id = 'qa-' + crypto.randomUUID();
    try {
      const row = {
        id,
        title: { nl: 'QA tijdelijke tip', en: 'QA temporary tip' },
        body: {
          nl: 'Tijdelijke test, wordt verwijderd.',
          en: 'Temporary test, will be deleted.',
        },
        icon: 'info',
        published: false,
      };
      expect(
        (await admin.from('first_year_tips').insert(row)).error,
      ).toBeNull();
      expect(
        (await publicDb().from('first_year_tips').select('id').eq('id', id))
          .data,
      ).toEqual([]);
      expect(
        (
          await admin
            .from('first_year_tips')
            .update({ published: true })
            .eq('id', id)
        ).error,
      ).toBeNull();
      expect(
        (await publicDb().from('first_year_tips').select('id').eq('id', id))
          .data,
      ).toHaveLength(1);
      const deniedNode=await publicDb().from('route_nodes').update({accessible:true}).eq('id','R8-0-entry').select('id');
      expect(deniedNode.error!==null||deniedNode.data?.length===0).toBe(true);
      const deniedGem=await publicDb().from('hidden_gems').update({status:'approved'}).eq('title',id).select('id');
      expect(deniedGem.error!==null||deniedGem.data?.length===0).toBe(true);
      expect(
        (await publicDb().from('server_credentials').select('*')).error,
      ).not.toBeNull();
      expect(
        (
          await publicDb()
            .storage.from('gem-photos')
            .upload('unauthorized-test.png', new Uint8Array([1, 2]), {
              contentType: 'image/png',
            })
        ).error,
      ).not.toBeNull();
      const base = await admin
        .from('route_nodes')
        .select('*')
        .eq('id', 'R8-0-entry')
        .single();
      expect(base.error).toBeNull();
      expect(
        (
          await admin
            .from('route_nodes')
            .update({ label: base.data!.label })
            .eq('id', 'R8-0-entry')
            .select('id')
        ).data,
      ).toHaveLength(1);
      expect(
        (
          await admin
            .from('locations')
            .update({ status: 'approved' })
            .eq('id', 'library')
            .select('id')
        ).data,
      ).toHaveLength(1);
      const identity = crypto.randomUUID().replaceAll('-', '').repeat(2);
      expect(
        (
          await serviceDb().rpc('consume_limit', {
            p_key: identity,
            p_max: 1,
            p_window: 60,
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await serviceDb().rpc('consume_limit', {
            p_key: identity,
            p_max: 1,
            p_window: 60,
          })
        ).error,
      ).not.toBeNull();
    } finally {
      await admin.from('first_year_tips').delete().eq('id', id);
    }
  },
);
