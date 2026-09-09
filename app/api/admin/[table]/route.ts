import { requireAdmin } from '@/lib/server/supabase';
import { failure, json, readJson, sameOrigin } from '@/lib/server/http';
import { adminSchemas, type AdminTable } from '@/lib/campus/validation';
function tableName(name: string): AdminTable {
  if (!Object.hasOwn(adminSchemas, name)) throw new Error('INVALID_INPUT');
  return name as AdminTable;
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { db } = await requireAdmin(request),
      table = tableName((await params).table);
    const rows:unknown[]=[];
    for(let offset=0;;offset+=500){
      const {data,error}=await db.from(table).select('*').order(table==='qr_locations'?'code':'id').range(offset,offset+499);
      if(error)throw error;
      rows.push(...data);
      if(data.length<500)break;
    }
    return json({ rows });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    sameOrigin(request);
    const { db, user } = await requireAdmin(request),
      table = tableName((await params).table);
    if(table==='user_feedback')throw Error('FORBIDDEN');
    const result = adminSchemas[table].safeParse(
      await readJson(request, 1000000),
    );
    if (!result.success) throw new Error('INVALID_INPUT');
    if(table==='data_reports'){
      const report=adminSchemas.data_reports.parse(result.data);
      const {data,error}=await db.from(table).update({status:report.status,internal_note:report.internal_note,reviewed_at:report.status==='pending'?null:new Date().toISOString(),reviewer_id:report.status==='pending'?null:user.id}).eq('id',report.id).select('id').single();
      if(error||!data)throw Error('INVALID_INPUT');
      return json({ok:true});
    }
    const { error } =
      table === 'hidden_gems'
        ? await db
            .from(table)
            .update(result.data as Record<string, unknown>)
            .eq('id', 'id' in result.data ? result.data.id : '')
        : await db.from(table).upsert(result.data as Record<string, unknown>);
    if (error) throw new Error('INVALID_INPUT');
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    sameOrigin(request);
    const { db } = await requireAdmin(request),
      table = tableName((await params).table);
    const body = await readJson(request);
    if (
      !body ||
      typeof body !== 'object' ||
      !('id' in body) ||
      typeof body.id !== 'string'
    )
      throw new Error('INVALID_INPUT');
    const { error } = await db
      .from(table)
      .delete()
      .eq(table === 'qr_locations' ? 'code' : 'id', body.id);
    if (error) throw new Error('INVALID_INPUT');
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
