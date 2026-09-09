import {planLines,planTransitions} from '../campus/plan-paths';
import type {Location,RouteNode,RouteEdge} from '../campus/types';
type Point=[number,number];
function projection(p:Point,a:Point,b:Point){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));const q:Point=[a[0]+t*dx,a[1]+t*dy];return {q,t,d:Math.hypot(q[0]-p[0],q[1]-p[1])};}
/** Room targets stop at a nearby corridor. No inferred doorway or room-to-room edge. */
export function buildPlanGraph(locations:Location[]){
 const nodes:RouteNode[]=[],edges:RouteEdge[]=[],attachments=new Map<string,string>();
 const segments=planLines.flatMap(l=>l.points.slice(1).map((b,i)=>({floor:l.floor,zone:l.zone,a:l.points[i],b,stops:[{q:l.points[i],t:0},{q:b,t:1}]})));
 function node(floor:string,p:Point){const x=+p[0].toFixed(3),y=+p[1].toFixed(3),id='plan-'+floor+'-'+String(x).replace('.','_')+'-'+String(y).replace('.','_');if(!nodes.some(n=>n.id===id))nodes.push({id,floor_id:floor,building_id:floor.split('-')[0],x:x*8,y:y*6,map_x:x,map_y:y,node_type:'corridor',label:{nl:'Gang',en:'Corridor'},accessible:false,accessibility_status:'unverified',verification_status:'needs_review'});return id;}
 function edge(a:string,b:string,kind:RouteEdge['edge_type']='corridor'){if(a===b)return;const n=nodes.find(n=>n.id===a)!,m=nodes.find(n=>n.id===b)!;const id=a+'--'+b;if(edges.some(e=>e.id===id))return;edges.push({id,from_node_id:a,to_node_id:b,weight:kind==='corridor'?Math.max(.01,Math.hypot(n.x-m.x,n.y-m.y)):kind==='outdoor'?200:35,edge_type:kind,accessible:false,accessibility_status:'unverified',verification_status:'needs_review',bidirectional:true,source_id:'guide',map_path:kind==='corridor'?[[n.map_x!,n.map_y!],[m.map_x!,m.map_y!]]:null});}
 // Split where another corridor's vertex lies on a segment.
 for(const s of segments)for(const l of planLines.filter(l=>l.floor===s.floor))for(const p of l.points){const v=projection(p,s.a,s.b);if(v.d<.03)s.stops.push(v);}
 for(const l of locations){
   if(l.map_x==null||l.map_y==null)continue;
   const options=segments.filter(s=>s.floor===l.floor_id).map(s=>({s,...projection([l.map_x!,l.map_y!],s.a,s.b)})).sort((a,b)=>a.d-b.d);
   const nearest=options[0];
   if(!nearest||nearest.d>3.8)continue;
   nearest.s.stops.push(nearest);attachments.set(l.id,node(l.floor_id,nearest.q));
 }
 for(const s of segments){const stops=s.stops.sort((a,b)=>a.t-b.t);for(let i=1;i<stops.length;i++)edge(node(s.floor,stops[i-1].q),node(s.floor,stops[i].q));}
 for(const transition of planTransitions){for(let i=1;i<transition.points.length;i++){const a=transition.points[i-1],b=transition.points[i];const ai=node(a[0],[a[1],a[2]]),bi=node(b[0],[b[1],b[2]]);for(const id of [ai,bi]){const n=nodes.find(n=>n.id===id)!;n.node_type=transition.kind==='stairs'?'staircase':'elevator';n.label={nl:transition.kind==='stairs'?'Trap':'Lift',en:transition.kind==='stairs'?'Stairs':'Lift'};}edge(ai,bi,transition.kind);}}
 const r8=node('R8-0',[24,55.5]),r10=node('R10-0',[39.4,87.1]);
 for(const [id,label] of [[r8,'R8'],[r10,'R10']]){const n=nodes.find(n=>n.id===id)!;n.node_type='main_entrance';n.label={nl:'Hoofdingang '+label,en:label+' main entrance'};attachments.set(label+'_MAIN',id);}
 // Building-level transition only: no unsurveyed outdoor line on either floor plan.
 edge(r8,r10,'outdoor');
 return {nodes,edges,attachments,entrances:{R8:r8,R10:r10}};
}
