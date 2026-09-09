import {readFileSync} from 'node:fs';
import {serviceDb} from '../lib/server/supabase';
for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){const m=/^([A-Z_]+)=(.*)$/.exec(line);if(m)process.env[m[1]]=m[2];}
const db=serviceDb();
const points:[string,string,number,number,string,string][]=[
 ['R8-0','toilet',24,42,'Toiletten bij iShop','Toilets near iShop'],['R8-1','toilet',24,39,'Toiletten R8 verdieping 1','Toilets R8 floor 1'],['R8-2','toilet',23.8,41.3,'Toiletten R8 verdieping 2','Toilets R8 floor 2'],['R8-3','toilet',35.3,74.5,'Toiletten R8 verdieping 3','Toilets R8 floor 3'],
 ['R10-0','toilet',37.3,76.8,'Toiletten bij de centrale hal','Toilets near the central hall'],['R10-1','toilet',49.5,59.7,'Toiletten R10 verdieping 1','Toilets R10 floor 1'],['R10-2','toilet',39.5,44.3,'Toiletten zone F, verdieping 2','Toilets zone F, floor 2'],['R10-3','toilet',40,45.2,'Toiletten zone F, verdieping 3','Toilets zone F, floor 3'],
 ['R8-0','accessible-toilet',24.8,40.9,'Toegankelijk toilet R8','Accessible toilet R8'],['R10-0','accessible-toilet',33.7,78.5,'Toegankelijk toilet centrale hal','Accessible toilet central hall'],
 ['R8-0','lift',33.7,71.1,'Lift bij auditorium','Lift near auditorium'],['R8-1','lift',33.7,71.1,'Lift R8 verdieping 1','Lift R8 floor 1'],['R8-2','lift',33.7,71.1,'Lift R8 verdieping 2','Lift R8 floor 2'],['R8-3','lift',33.7,71.1,'Lift R8 verdieping 3','Lift R8 floor 3'],
 ['R10-0','stairs',47.8,46.9,'Trap zone F','Stairs zone F'],['R10-1','stairs',47.2,46.7,'Trap zone F, verdieping 1','Stairs zone F, floor 1'],['R10-2','stairs',47.5,45.5,'Trap zone F, verdieping 2','Stairs zone F, floor 2'],['R10-3','stairs',47,47.3,'Trap zone F, verdieping 3','Stairs zone F, floor 3'],
 ['R8-0','auditorium',42,73,'Auditorium R8','Auditorium R8'],['R8-0','study',34,64,'Studielandschap centrale hal','Study landscape central hall'],
 ['R8-0','first-aid',23.8,44.6,'EHBO-ruimte R8','First aid room R8'],
 ];
const {data:cats,error:catError}=await db.from('location_categories').select('id');if(catError)throw catError;
const aliases:Record<string,string>={'accessible-toilet':'accessible-toilet',lift:'elevator',stairs:'stairs','first-aid':'first-aid'};
const rows=points.map(([floor,category,map_x,map_y,nl,en])=>{const cat=aliases[category]??category;if(!cats.some(c=>c.id===cat))throw Error('Unknown category '+cat);return {id:'plan-'+floor+'-'+category,building_id:floor.split('-')[0],floor_id:floor,category_id:cat,name:{nl,en},description:{nl:'Aangegeven op de NHL Stenden-plattegrond. Actueel gebruik moet nog worden gecontroleerd.',en:'Shown on the NHL Stenden plan. Current use still needs confirmation.'},aliases:category==='toilet'?['wc','toilet','restroom','bathroom']:[],map_x,map_y,x:map_x*8,y:map_y*6,node_id:null,status:'approved',verification_status:'needs_review',source_id:'guide',source_page:(floor.startsWith('R8')?18:22)+Number(floor.slice(-1)),verification_notes:'Facility symbol/label read from original guide. Current availability and accessibility not physically verified.'};});
const {error}=await db.from('locations').upsert(rows,{onConflict:'id',ignoreDuplicates:true});if(error)throw error;
console.log('Source-labelled facilities prepared: '+rows.length);
