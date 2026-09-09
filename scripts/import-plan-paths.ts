import {readFileSync} from 'node:fs';
import {serviceDb} from '../lib/server/supabase';
import {buildPlanGraph} from '../lib/routing/plan-graph';
import type {Location} from '../lib/campus/types';
for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){const m=/^([A-Z_]+)=(.*)$/.exec(line);if(m)process.env[m[1]]=m[2];}
const db=serviceDb(),locations:Location[]=[];
const hot:Record<string,[number,number]>={library:[10,33],'cafe-if':[13,44],canteen:[54,77],brandstof:[43,53],espresso:[45,83],'food-court':[54,70],'central-brew':[34,62],'student-info':[27,50],ishop:[9.5,43],R8_MAIN:[24,55.5],R10_MAIN:[39.4,87.1],'service-desk':[34,78]};
for(const [id,[map_x,map_y]] of Object.entries(hot)){const {error}=await db.from('locations').update({map_x,map_y}).eq('id',id).is('map_x',null);if(error)throw error;}
for(let offset=0;;offset+=500){const {data,error}=await db.from('locations').select('*').order('id').range(offset,offset+499);if(error)throw error;locations.push(...data);if(data.length<500)break;}
const graph=buildPlanGraph(locations);
for(const [table,rows] of [['route_nodes',graph.nodes],['route_edges',graph.edges]] as const){for(let i=0;i<rows.length;i+=100){const {error}=await db.from(table).upsert(rows.slice(i,i+100) as Record<string,unknown>[]);if(error)throw error;}}
// Preserve campus-verified links; replace only the old prototype/empty attachment.
const changes=locations.filter(l=>l.verification_status!=='verified').map(l=>({...l,node_id:graph.attachments.get(l.id)??null}));
const linked=changes.filter(l=>l.node_id).length;
for(let i=0;i<changes.length;i+=100){const {error}=await db.from('locations').upsert(changes.slice(i,i+100));if(error)throw error;}
for(const b of ['R8','R10'] as const){const {error}=await db.from('qr_locations').update({route_node_id:graph.entrances[b]}).eq('code',b+'_MAIN_ENTRANCE');if(error)throw error;}
console.log(JSON.stringify({nodes:graph.nodes.length,edges:graph.edges.length,linked,locations:locations.length}));
