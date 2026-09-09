import {readFileSync} from 'node:fs';
import {serviceDb} from '../lib/server/supabase';
import {catalogLocations} from '../lib/campus/catalog';
import type {Location} from '../lib/campus/types';
for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){const m=/^([A-Z_]+)=(.*)$/.exec(line);if(m)process.env[m[1]]=m[2];}
const db=serviceDb(),existing:Location[]=[];
for(let offset=0;;offset+=500){const {data,error}=await db.from('locations').select('*').order('id').range(offset,offset+499);if(error)throw error;existing.push(...data);if(data.length<500)break;}
const generated=catalogLocations(existing),newRows=generated.filter(l=>!existing.some(x=>x.id===l.id));
for(let i=0;i<newRows.length;i+=100){const {error}=await db.from('locations').upsert(newRows.slice(i,i+100));if(error)throw error;}
// Existing content stays intact. Only fill absent original-plan coordinates.
for(const row of generated.filter(l=>existing.some(x=>x.id===l.id&&x.map_x==null))){const {error}=await db.from('locations').update({map_x:row.map_x,map_y:row.map_y,source_page:row.source_page,verification_notes:row.verification_notes}).eq('id',row.id);if(error)throw error;}
const knownRooms=new Set<string>();
for(let i=0;;i+=500){const {data,error}=await db.from('rooms').select('location_id').order('id').range(i,i+499);if(error)throw error;data.forEach(r=>knownRooms.add(r.location_id));if(data.length<500)break;}
const rooms=generated.filter(l=>!knownRooms.has(l.id)).map(l=>({id:'room-'+l.id,code:l.room_code,location_id:l.id,public:true}));
for(let i=0;i<rooms.length;i+=100){const {error}=await db.from('rooms').upsert(rooms.slice(i,i+100));if(error)throw error;}
console.log(JSON.stringify({catalog:generated.length,added:newRows.length,roomRows:rooms.length}));
