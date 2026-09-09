import catalog from './room-catalog.json';
import type {Location} from './types';
import {normalizeRoomCode} from '@/lib/routing/normalization';
export {catalog};
export function catalogLocations(existing:Location[]):Location[]{
 return catalog.map(r=>{
   const old=existing.find(l=>l.building_id===r.building_id&&normalizeRoomCode(l.room_code??'')===normalizeRoomCode(r.code));
   const code=r.building_id==='R10'?r.code.slice(0,2)+'.'+r.code.slice(2):r.code;
   return {...(old??{id:r.building_id+'-'+normalizeRoomCode(r.code),name:{nl:'Lokaal '+code,en:'Room '+code},description:{nl:'Lokaal op de gepubliceerde campusplattegrond.',en:'Room shown on the published campus plan.'},building_id:r.building_id,floor_id:r.floor_id,category_id:'room',room_code:code,aliases:[r.code],node_id:null,x:r.map_x*8,y:r.map_y*6,status:'approved',verification_status:'needs_review',source_id:'guide'}),map_x:r.map_x,map_y:r.map_y,source_page:r.source_page,verification_notes:'Printed label in NHL Stenden guide (public copy 2024). Position is label centre, not surveyed doorway. Current use and numbering need campus review.'} as Location;
 });
}
