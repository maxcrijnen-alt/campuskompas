import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.116.0';
// The only caller is the CampusKompas server. The random gateway credential is
// never shipped to students; only its SHA-256 hash is stored in the database.
Deno.serve(async(request:Request)=>{
 const secret=request.headers.get('x-campus-secret');
 if(!secret||secret.length<40)return new Response('Unauthorized',{status:401});
 const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret))),b=>b.toString(16).padStart(2,'0')).join('');
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data}=await db.from('server_credentials').select('id').eq('id','campus-server').eq('secret_hash',hash).maybeSingle();
 if(!data)return new Response('Unauthorized',{status:401});
 const path=new URL(request.url).searchParams.get('path')??'';
 const allowed=/^\/rest\/v1\/(buildings|floors|locations|rooms|location_categories|source_records|route_nodes|route_edges|opening_hours|opening_hour_exceptions|first_year_tips|qr_locations|hidden_gems|hidden_gem_votes|data_reports|user_feedback)(\?|$)/.test(path)||/^\/rest\/v1\/rpc\/(consume_limit|vote_gem)(\?|$)/.test(path)||/^\/storage\/v1\/object\/(gem-photos|authenticated\/gem-photos)(\/|\?|$)/.test(path)||/^\/auth\/v1\/admin\/users(\/[-a-f0-9]+)?(\?|$)/.test(path);
 if(!allowed||path.includes('..')||path.includes('\\'))return new Response('Forbidden',{status:403});
 const target=new URL(path,url);if(target.origin!==new URL(url).origin)return new Response('Forbidden',{status:403});
 const headers=new Headers();for(const h of ['content-type','prefer','range','x-upsert','accept']){const v=request.headers.get(h);if(v)headers.set(h,v);}headers.set('apikey',key);headers.set('Authorization','Bearer '+key);
 const response=await fetch(target,{method:request.method,headers,body:request.method==='GET'||request.method==='HEAD'?undefined:request.body,redirect:'error'});
 const output=new Headers();for(const h of ['content-type','content-range']){const v=response.headers.get(h);if(v)output.set(h,v);}output.set('Cache-Control','no-store');
 return new Response(response.body,{status:response.status,headers:output});
});
