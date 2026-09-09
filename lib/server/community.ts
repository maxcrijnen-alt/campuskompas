import { serviceDb } from './supabase';
import { device, json, readJson, sameOrigin } from './http';
import { feedbackSchema, reportSchema } from '@/lib/campus/reports';
export async function saveCommunity(request:Request, kind:'reports'|'feedback') {
  sameOrigin(request);
  const body=await readJson(request,8000);
  const parsed=(kind==='reports'?reportSchema:feedbackSchema).safeParse(body);
  if(!parsed.success || Date.now()-parsed.data.started_at<1500 || Date.now()-parsed.data.started_at>86400000) throw Error('INVALID_INPUT');
  const db=serviceDb(), identity=await device(request);
  const {error:limit}=await db.rpc('consume_limit',{p_key:identity.hash+':'+kind,p_max:kind==='reports'?8:20,p_window:3600});
  if(limit) throw Error(limit.message.includes('RATE_LIMIT')?'RATE_LIMIT':'SERVICE_UNAVAILABLE');
  if(parsed.data.entity_id){
    const {data,error}=await db.from('locations').select('id').eq('id',parsed.data.entity_id).eq('status','approved').maybeSingle();
    if(error) throw error;
    if(!data) throw Error('INVALID_INPUT');
  }
  const {website: _website,started_at: _started,...values}=parsed.data;
  const {error}=await db.from(kind==='reports'?'data_reports':'user_feedback').insert(values as Record<string,unknown>);
  if(error) throw error;
  return json({ok:true},201,{'Set-Cookie':identity.cookie});
}
